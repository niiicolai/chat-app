import Validator from '../../shared/validators/user_service_validator.js';
import PwdService from '../../shared/services/pwd_service.js';
import JwtService from '../../shared/services/jwt_service.js';
import UserAvatarUploader from '../../shared/uploaders/user_avatar_uploader.js';
import err from '../../shared/errors/index.js';
import UserEmailVerificationService from './user_email_verification_service.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/user_dto.js';
import userLoginDto from '../dto/user_login_dto.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @constant uploader
 * @description User avatar uploader instance.
 * @type {UserAvatarUploader}
 */
const uploader = new UserAvatarUploader();

/**
 * @class UserService
 * @description Service class for users.
 * @exports UserService
 */
class UserService {

    /**
     * @function findOne
     * @description Find a user by uuid.
     * @param {Object} options
     * @param {string} options.uuid
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null }) {
        Validator.findOne(options);

        const user = await neodeInstance.model("User").find(options.uuid);
        if (!user) throw new err.EntityNotFoundError('user');

        const user_status = user.get('user_status').endNode();
        const user_status_state = user_status.get('user_status_state').endNode();
        const user_email_verification = user.get('user_email_verification').endNode();

        return dto({
            ...user.properties(),
            user_status: user_status.properties(),
            user_status_state: user_status_state.properties(),
            user_email_verification: user_email_verification.properties()
        })
    }

    /**
     * @function create
     * @description Create a user.
     * @param {Object} options
     * @param {Object} options.body
     * @param {string} options.body.uuid
     * @param {string} options.body.email
     * @param {string} options.body.username
     * @param {string} options.body.password
     * @param {Object} options.file optional
     * @param {Boolean} disableVerifyInTest (optional)
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, file: null }, disableVerifyInTest = false) {
        Validator.create(options);

        const { file } = options;
        const { uuid, email, username, password } = options.body;

        const avatar_src = (file && file.size > 0) ? await uploader.create(file, uuid) : null
        const user_login_password = await PwdService.hash(password);

        const session = neodeInstance.session();
        await session.writeTransaction(async tx => {
            const uuidUsed = await tx.run('MATCH (u:User) WHERE u.uuid = $uuid RETURN u', { uuid });
            if (uuidUsed.records.length > 0) throw new err.DuplicateEntryError('user', 'PRIMARY', uuid);

            const mailUsed = await tx.run('MATCH (u:User) WHERE u.email = $email RETURN u', { email });
            if (mailUsed.records.length > 0) throw new err.DuplicateEntryError('user', 'user_email', email);

            const usernameUsed = await tx.run('MATCH (u:User) WHERE u.username = $username RETURN u', { username });
            if (usernameUsed.records.length > 0) throw new err.DuplicateEntryError('user', 'user_username', username);
            
            // Create user
            await tx.run(
                'CREATE (u:User {uuid: $uuid, email: $email, username: $username})',
                { uuid, email, username }
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
                    is_verified: (process.env.NODE_ENV === 'test' && !disableVerifyInTest) ? true : false
                }
            );

            // Create user login
            await tx.run(
                'MATCH (u:User {uuid: $uuid}) ' +
                'MATCH (ult:UserLoginType {name: "Password"}) ' +
                'CREATE (ul:UserLogin {uuid: $login_uuid, password: $user_login_password}) ' +
                'CREATE (ul)-[:TYPE_IS]->(ult) ' +
                'CREATE (u)-[:AUTHORIZE_VIA]->(ul)',
                {
                    uuid, 
                    login_uuid: uuidv4(),
                    user_login_password
                }
            );

            // Create user avatar if provided
            if (avatar_src) {
                await tx.run(
                    'MATCH (u:User {uuid: $uuid}) ' +
                    'SET u.avatar_src = $avatar_src',
                    { uuid, avatar_src }
                );
            }
        }).catch(error => {
            // rollback avatar upload if error occurs
            if (avatar_src) uploader.destroy(avatar_src);
            console.error('transaction', error);
            throw error;
        }).finally(() => {
            session.close();
        });

        if (process.env.NODE_ENV !== 'test') {
            await UserEmailVerificationService.resend({ user_uuid: uuid });
        }

        const user = await this.findOne({ uuid });

        return { user, token: JwtService.sign(uuid) };
    }

    async update(options = { uuid: null, body: null, file: null }) {
        Validator.update(options);
    }

    async login(options = { body: null }) {
        Validator.login(options);

        const { email, password } = options.body;
        const result = await neodeInstance.cypher(
            'MATCH (u:User) WHERE u.email = $email ' +
            'MATCH (u)-[:HAS_USER_STATUS]->(us:UserStatus) ' +
            'MATCH (us)-[:HAS_USER_STATUS_STATE]->(uss:UserStatusState) ' +
            'MATCH (u)-[:HAS_USER_EMAIL_VERIFICATION]->(uev:UserEmailVerification) ' +
            'MATCH (ul:UserLogin)-[:HAS_USER]->(u) ' +
            'MATCH (ul)-[:HAS_LOGIN_TYPE]->(ult:UserLoginType {name: "Password"}) ' +
            'RETURN u, us, uev, ul, ult, uss',
            { email }
        );

        if (!result?.records[0]) throw new ControllerError(400, 'Invalid email or password');

        const savedUser = result?.records[0]?.get('u').properties;
        const savedUserLogin = result?.records[0]?.get('ul').properties;

        if (!savedUserLogin || !await bcrypt.compare(password, savedUserLogin.password)) {
            throw new ControllerError(400, 'Invalid email or password');
        }

        return {
            token: JwtService.sign(savedUser.uuid),
            user: dto(savedUser, [
                { user_status: result?.records[0]?.get('us').properties },
                { user_email_verification: result?.records[0]?.get('uev').properties },
                { user_status_state: result?.records[0]?.get('uss').properties }
            ])
        };
    }

    /**
     * @function destroy
     * @description Destroy a user.
     * @param {Object} options
     * @param {string} options.uuid
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null }) {
        Validator.destroy(options);

        const { uuid } = options;
        const existingInstance = await neodeInstance.model('User').find(uuid);
        if (!existingInstance) throw new err.EntityNotFoundError('user');

        const savedUser = existingInstance.properties();

        const session = neodeInstance.session();
        await session.writeTransaction(async tx => {

            // Delete user
            await tx.run(
                'MATCH (u:User {uuid: $uuid}) ' +
                'DETACH DELETE u',
                { uuid }
            );

            if (savedUser.avatar_src) {
                await uploader.destroy(savedUser.avatar_src);
            }

            tx.commit();
        }).catch(error => {
            console.error('transaction', error);
            throw error;
        }).finally(() => {
            session.close();
        });
    }

    async destroyAvatar(options = { uuid: null }) {
        Validator.destroyAvatar(options);

        const { uuid } = options;
        const existingInstance = await neodeInstance.model('User').find(uuid);
        if (!existingInstance) throw new ControllerError(400, 'User not found');

        const savedUser = existingInstance.properties();
        if (savedUser.avatar_src) {
            await existingInstance.update({ avatar_src: null });
            await uploader.destroy(savedUser.avatar_src);
        }
    }

    async getUserLogins(options = { uuid: null }) {
        Validator.getUserLogins(options);

        const user = await neodeInstance.model('User').find(options.uuid);
        if (!user) throw new ControllerError(404, 'User not found');

        const result = await neodeInstance.cypher(
            'MATCH (ul:UserLogin)-[:HAS_USER]->(u:User {uuid: $uuid}) ' +
            'MATCH (ul)-[:HAS_LOGIN_TYPE]->(ult:UserLoginType) ' +
            'RETURN ul, ult',
            { uuid: options.uuid }
        );

        return result.records.map(record => userLoginDto({
            ...record.get('ul').properties,
            user_login_type: record.get('ult').properties
        }));
    }

    async destroyUserLogins(options = { uuid: null, login_uuid: null }) {
        Validator.destroyUserLogins(options);

        const [userLogin, userLogins] = await Promise.all([
            neodeInstance.model('UserLogin').find(options.login_uuid),
            neodeInstance.cypher(
                'MATCH (ul:UserLogin)-[:HAS_USER]->(u:User {uuid: $uuid}) ' +
                'MATCH (ul)-[:HAS_LOGIN_TYPE]->(ult:UserLoginType) ' +
                'RETURN ul, ult',
                { uuid: options.uuid }
            )
        ]);

        if (!userLogin) throw new ControllerError(404, 'User login not found');
        if (userLogin.get('user_login_type').get('name') === 'Password') throw new ControllerError(400, 'Cannot delete password login');
        if (userLogins.records.length === 1) throw new ControllerError(400, 'You cannot delete your last login');

        await userLogin.delete();
    }

    async createUserLogin(options = { uuid: null, body: null }) {
        Validator.createUserLogin(options);

        const { uuid, body } = options;
        const user = await neodeInstance.model('User').find(uuid);
        if (!user) throw new ControllerError(404, 'User not found');

        const userLoginType = await neodeInstance.model('UserLoginType').find(body.user_login_type_name);
        if (!userLoginType) throw new ControllerError(404, 'User login type not found');

        const { user_login_type_name } = body;

        if (user_login_type_name === 'Password') {
            if (!body.password) throw new ControllerError(400, 'No password provided');
            body.password = bcrypt.hashSync(body.password, SALT_ROUNDS);
        } else body.password = null;

        if (user_login_type_name === 'Google') {
            if (!body.third_party_id) throw new ControllerError(400, 'No third_party_id provided');
        } else body.third_party_id = null;

        const userLogin = await neodeInstance.model('UserLogin').create({
            ...body
        });

        await userLogin.relateTo(user, 'user');
        await userLogin.relateTo(userLoginType, 'user_login_type');

        return userLoginDto({
            ...userLogin.properties(),
            user_login_type: userLoginType.properties()
        });
    }
}

const service = new UserService();

export default service;
