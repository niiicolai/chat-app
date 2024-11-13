import JwtService from '../../shared/services/jwt_service.js';
import ControllerError from '../../shared/errors/controller_error.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/user_dto.js';
import { v4 as uuidv4 } from 'uuid';

class Service {
    async create(options = { info: null }) {
        if (!options.info) throw new ControllerError(500, 'The response from Google is empty');
        if (!options.info.data) throw new ControllerError(500, 'No data in the response from Google');
        if (!options.info.data.email) throw new ControllerError(500, 'No email in the response from Google');
        if (!options.info.data.id) throw new ControllerError(500, 'No id in the response from Google');

        const { id: third_party_id, email, picture: avatar_src } = options.info.data;

        if ((await neodeInstance.cypher('MATCH (u:User) WHERE u.email = $email RETURN u', { email })).records.length > 0) {
            throw new ControllerError(400, 'Account already linked already exists. Please login instead!');
        }
        if ((await neodeInstance.cypher('MATCH (ul:UserLogin) WHERE ul.third_party_id = $third_party_id RETURN ul', { third_party_id })).records.length > 0) {
            throw new ControllerError(400, 'Account already linked already exists. Please login instead!');
        }

        const userStatusState = await neodeInstance.model('UserStatusState').find('Offline');
        if (!userStatusState) throw new ControllerError(500, 'User status state not found');

        const userLoginType = await neodeInstance.model('UserLoginType').find('Google');
        if (!userLoginType) throw new ControllerError(500, 'User login type not found');

        const now = new Date();
        const uuid = uuidv4();
        const username = `user${now.getTime()}`;

        const userLogin = await neodeInstance.model('UserLogin').create({
            uuid: uuidv4(),
            third_party_id,
        });

        const userState = await neodeInstance.model('UserStatus').create({
            last_seen_at: new Date(),
            message: "No message",
            total_online_hours: 0,
        });

        const userEmailVerification = await neodeInstance.model('UserEmailVerification').create({
            uuid: uuidv4(),
            is_verified: true,
        });

        const savedUser = await neodeInstance.model('User').create({
            uuid,
            username,
            email,
            avatar_src,
            created_at: new Date(),
            updated_at: new Date()
        });

        await userState.relateTo(userStatusState, 'user_status_state');
        await savedUser.relateTo(userState, 'user_status');
        await savedUser.relateTo(userEmailVerification, 'user_email_verification');
        await userLogin.relateTo(savedUser, 'user');
        await userLogin.relateTo(userLoginType, 'user_login_type');

        return {
            token: JwtService.sign(uuid),
            user: dto(savedUser.properties(), [
                { user_status: userState.properties() },
                { user_email_verification: userEmailVerification.properties() },
                { user_status_state: userStatusState.properties() }
            ]),
        };
    }

    async login(options = { info: null }) {
        if (!options.info) throw new ControllerError(500, 'The response from Google is empty');
        if (!options.info.data) throw new ControllerError(500, 'No data in the response from Google');
        if (!options.info.data.id) throw new ControllerError(500, 'No id in the response from Google');

        const { id: third_party_id } = options.info.data;

        const userLoginType = await neodeInstance.model('UserLoginType').find('Google');
        if (!userLoginType) throw new ControllerError(500, 'User login type not found');

        const userLoginResult = await neodeInstance.cypher(
            'MATCH (ul:UserLogin { third_party_id: $third_party_id })-[:HAS_LOGIN_TYPE]->(ult:UserLoginType { name: "Google" }) RETURN ul',
            { third_party_id }
        );
        if (!userLoginResult.records.length) throw new ControllerError(400, 'User not found');
        const userLogin = userLoginResult.records[0].get('ul').properties;
        
        const savedUserResult = await neodeInstance.cypher(
            'MATCH (ul:UserLogin { uuid: $uuid })-[:HAS_USER]->(u:User) ' +
            'MATCH (u)-[:HAS_USER_STATUS]->(us:UserStatus) ' +
            'MATCH (us)-[:HAS_USER_STATUS_STATE]->(uss:UserStatusState) ' +
            'MATCH (u)-[:HAS_USER_EMAIL_VERIFICATION]->(uev:UserEmailVerification) ' +
            'MATCH (ul)-[:HAS_LOGIN_TYPE]->(ult:UserLoginType {name: "Google"}) ' +
            'RETURN u, us, uev, ul, ult, uss',
            { uuid: userLogin.uuid }
        );
        
        if (!savedUserResult.records.length) throw new ControllerError(400, 'User not found');
        const savedUser = savedUserResult.records[0].get('u').properties;

        return {
            token: JwtService.sign(savedUser.uuid),
            user: dto(savedUser, [
                { user_status: savedUserResult.records[0].get('us').properties },
                { user_email_verification: savedUserResult.records[0].get('uev').properties },
                { user_status_state: savedUserResult.records[0].get('uss').properties }
            ]),
        };
    }
}

const service = new Service();

export default service;