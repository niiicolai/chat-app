import Validator from '../../shared/validators/google_auth_service_validator.js';
import JwtService from '../../shared/services/jwt_service.js';
import err from '../../shared/errors/index.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/user_dto.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @class GoogleAuthService
 * @description Service class for Google auth
 * @exports GoogleAuthService
 */
class GoogleAuthService {

    async create(options = { info: null, user_uuid: null }) {
        Validator.create(options);

        const { id: third_party_id, email } = options.info.data;

        const thirdPartyIdExist = await neodeInstance.model('UserLogin').first({ third_party_id });
        if (thirdPartyIdExist) throw new err.DuplicateEntryError('user', 'third_party_id', third_party_id);

        const emailExist = await neodeInstance.model('User').first({ email });
        if (emailExist) throw new err.DuplicateEntryError('user', 'email', email);

        const now = new Date();
        const uuid = options.user_uuid || uuidv4();

        const session = neodeInstance.session();
        await session.writeTransaction(async tx => {

            // Create user
            await tx.run(
                'CREATE (u:User {uuid: $uuid, email: $email, username: $username})',
                { uuid, email, username: `user${now.getTime()}` }
            );

            // Create user status
            await tx.run(
                'MATCH (u:User {uuid: $uuid}) ' +
                'MATCH (uss:UserStatusState {name: "Offline"}) ' +
                'CREATE (us:UserStatus {uuid: $status_uuid, last_seen_at: $last_seen_at, message: $message, total_online_hours: $total_online_hours}) ' +
                'CREATE (u)-[:STATUS_IS]->(us) ' +
                'CREATE (us)-[:STATE_IS]->(uss)',
                {
                    uuid,
                    status_uuid: uuidv4(),
                    last_seen_at: new Date().toDateString(),
                    message: 'new msg',
                    total_online_hours: 0
                }
            );

            // Create user email verification
            await tx.run(
                'MATCH (u:User {uuid: $uuid}) ' +
                'CREATE (uev:UserEmailVerification {uuid: $user_email_verification_uuid, is_verified: $is_verified}) ' +
                'CREATE (u)-[:EMAIL_VERIFY_VIA]->(uev)',
                {
                    uuid,
                    user_email_verification_uuid: uuidv4(),
                    is_verified: true
                }
            );

            // Create user login
            await tx.run(
                'MATCH (u:User {uuid: $uuid}) ' +
                'MATCH (ult:UserLoginType {name: "Google"}) ' +
                'CREATE (ul:UserLogin {uuid: $login_uuid, third_party_id: $third_party_id}) ' +
                'CREATE (ul)-[:TYPE_IS]->(ult) ' +
                'CREATE (u)-[:AUTHORIZE_VIA]->(ul)',
                {
                    uuid,
                    login_uuid: uuidv4(),
                    third_party_id
                }
            );
        }).catch(error => {
            console.error('transaction', error);
            throw error;
        }).finally(() => {
            session.close();
        });

        const savedUser = await neodeInstance.model('User').find(uuid);
        const userStatus = savedUser.get('user_status').endNode();
        const userStatusState = userStatus.get('user_status_state').endNode();
        const userEmailVerification = savedUser.get('user_email_verification').endNode();

        return {
            token: JwtService.sign(uuid),
            user: dto({
                ...savedUser.properties(),
                user_status: userStatus.properties(),
                user_status_state: userStatusState.properties(),
                user_email_verification: userEmailVerification.properties()
            })
        };
    }

    async login(options = { info: null }) {
        Validator.login(options);

        const { id: third_party_id } = options.info.data;

        const userLoginResult = await neodeInstance.cypher(
            'MATCH (ul:UserLogin { third_party_id: $third_party_id })-[:TYPE_IS]->(ult:UserLoginType { name: "Google" }) ' +
            'MATCH (u:User)-[:AUTHORIZE_VIA]->(ul) ' +
            'MATCH (u)-[:STATUS_IS]->(us:UserStatus)-[:STATE_IS]->(uss:UserStatusState) ' +
            'MATCH (u)-[:EMAIL_VERIFY_VIA]->(uev:UserEmailVerification) ' +  
            'RETURN ul, u, us, uss, uev',
            { third_party_id }
        );
        if (!userLoginResult.records.length) throw new err.EntityNotFoundError('user_login');

        const user = userLoginResult.records[0].get('u').properties;
        const user_status = userLoginResult.records[0].get('us').properties;
        const user_status_state = userLoginResult.records[0].get('uss').properties;
        const user_email_verification = userLoginResult.records[0].get('uev').properties;

        return {
            token: JwtService.sign(user.uuid),
            user: dto({ ...user, user_status, user_status_state, user_email_verification }),
        };
    }

    /**
     * @function addToExistingUser
     * @description Add a Google account to an existing user
     * @param {Object} options
     * @param {String} options.third_party_id
     * @param {String} options.type
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {String} options.login_uuid optional
     * @returns {void}
     */
    async addToExistingUser(options = { third_party_id: null, type: null, user: null, login_uuid: null }) {
        Validator.addToExistingUser(options);

        const result = await neodeInstance.cypher(
            'MATCH (ul:UserLogin { third_party_id: $third_party_id })-[:TYPE_IS]->(ult:UserLoginType { name: $type }) ' +
            'MATCH (u:User { uuid: $uuid })-[:AUTHORIZE_VIA]->(ul)' +
            'RETURN ul',
            { third_party_id: options.third_party_id, type: options.type, uuid: options.user.sub }
        );

        if (result.records.length > 0) {
            throw new err.DuplicateThirdPartyLoginError("Google");
        }

        if (options.type !== 'Google') {
            throw new err.ControllerError(400, 'Only Google are currently supported');
        }

        const savedUser = await neodeInstance.model('User').find(options.user.sub);
        if (!savedUser) throw new err.EntityNotFoundError('user');

        const session = neodeInstance.session();
        await session.writeTransaction(async tx => {
            // Create user login
            await tx.run(
                'MATCH (u:User {uuid: $uuid}) ' +
                'MATCH (ult:UserLoginType {name: $user_login_type_name}) ' +
                'CREATE (ul:UserLogin {uuid: $login_uuid, third_party_id: $third_party_id}) ' +
                'CREATE (ul)-[:TYPE_IS]->(ult) ' +
                'CREATE (u)-[:AUTHORIZE_VIA]->(ul)',
                { 
                    uuid: options.user.sub,
                    login_uuid: options.login_uuid || uuidv4(),
                    third_party_id: options.third_party_id,
                    user_login_type_name: options.type
                }
            );
        }).catch(error => {
            console.error('transaction', error);
            throw error;
        }).finally(() => {
            session.close();
        });
    }
}

const service = new GoogleAuthService();

export default service;
