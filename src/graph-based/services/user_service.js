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

        const mailUsed = await neodeInstance.model('User').first({ email });
        if (mailUsed) throw new err.DuplicateEntryError('user', 'user_email', email);

        const usernameUsed = await neodeInstance.model('User').first({ username }); 
        if (usernameUsed) throw new err.DuplicateEntryError('user', 'user_username', username);

        const uuidUsed = await neodeInstance.model('User').find(uuid);
        if (uuidUsed) throw new err.DuplicateEntryError('user', 'PRIMARY', uuid);

        const avatar_src = (file && file.size > 0) ? await uploader.create(file, uuid) : null
        const user_login_password = await PwdService.hash(password);

        const session = neodeInstance.session();
        await session.writeTransaction(async tx => {
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

    /**
     * @function update
     * @description Update a user.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.body
     * @param {string} options.body.username optional
     * @param {string} options.body.email optional
     * @param {string} options.body.password optional
     * @param {Object} options.file optional
     * @returns {Promise<Object>}
     */
    async update(options = { uuid: null, body: null, file: null }) {
        Validator.update(options);

        const { body, file, uuid } = options;
        const { email, username, password } = body;

        let savedUser = await neodeInstance.model('User').find(uuid);
        if (!savedUser) throw new err.EntityNotFoundError('user');
        savedUser = savedUser.properties();

        if (email && email !== savedUser.email) {
            const mailUsed = await neodeInstance.model('User').first({ email });
            if (mailUsed) throw new err.DuplicateEntryError('user', 'user_email', email);
        }

        if (username && username !== savedUser.username) {
            const usernameUsed = await neodeInstance.model('User').first({ username });
            if (usernameUsed) throw new err.DuplicateEntryError('user', 'user_username', username);
        }

        const user_uuid = uuid;
        const user_login_type_name = 'Password';
        const user_login_password = password ? await PwdService.hash(password) : null;
        const avatar_src = (file && file.size > 0) ? await uploader.create(file, uuid) : null;

        const session = neodeInstance.session();
        await session.writeTransaction(async tx => {
            // update email if provided
            if (body.email && body.email !== savedUser.email) {
                await tx.run(
                    'MATCH (u:User {uuid: $user_uuid}) ' +
                    'SET u.email = $email',
                    { user_uuid, email }
                );
            }

            // update username if provided
            if (body.username && body.username !== savedUser.username) {
                await tx.run(
                    'MATCH (u:User {uuid: $user_uuid}) ' +
                    'SET u.username = $username',
                    { user_uuid, username }
                );
            }

            // update or create user login if user does not have a password login
            if (user_login_password) {
                const userLogin = await tx.run(
                    'MATCH (u:User {uuid: $user_uuid}) ' +
                    'MATCH (ult:UserLoginType {name: "Password"}) ' +
                    'MATCH (u)-[:AUTHORIZE_VIA]->(ul:UserLogin) ' +
                    'MATCH (ul)-[:TYPE_IS]->(ult) ' +
                    'RETURN ul',
                    { user_uuid }
                );

                if (userLogin.records.length > 0) {
                    await tx.run(
                        'MATCH (u:User {uuid: $user_uuid}) ' +
                        'MATCH (ult:UserLoginType {name: "Password"}) ' +
                        'MATCH (u)-[:AUTHORIZE_VIA]->(ul:UserLogin) ' +
                        'SET ul.password = $user_login_password',
                        { user_uuid, user_login_password }
                    );
                } else {
                    await tx.run(
                        'MATCH (u:User {uuid: $user_uuid}) ' +
                        'MATCH (ult:UserLoginType {name: $user_login_type_name}) ' +
                        'CREATE (ul:UserLogin {uuid: $login_uuid, password: $user_login_password}) ' +
                        'CREATE (ul)-[:TYPE_IS]->(ult) ' +
                        'CREATE (u)-[:AUTHORIZE_VIA]->(ul)',
                        { user_uuid, user_login_type_name, login_uuid: uuidv4(), user_login_password }
                    );
                }
            }

            if (avatar_src) {
                await tx.run(
                    'MATCH (u:User {uuid: $user_uuid}) ' +
                    'SET u.avatar_src = $avatar_src',
                    { user_uuid, avatar_src }
                );

                if (savedUser.avatar_src) {
                    // Old file must be deleted last to prevent database update failures
                    // to delete the file if the database update fails.
                    await uploader.destroy(savedUser.avatar_src);
                }
            }
        }).catch((error) => {
            // If an error occurs, delete the new avatar file if it exists.
            if (avatar_src) uploader.destroy(avatar_src);

            console.error(error);
            throw error;
        });

        return await this.findOne({ uuid });
    }

    async login(options = { body: null }) {
        Validator.login(options);

        const { email, password } = options.body;
        const result = await neodeInstance.cypher(
            'MATCH (u:User {email: $email}) ' +
            'MATCH (u)-[:AUTHORIZE_VIA]->(ul:UserLogin) ' +
            'MATCH (ul)-[:TYPE_IS]->(ult:UserLoginType {name: "Password"}) ' +
            'MATCH (u)-[:STATUS_IS]->(us:UserStatus) ' +
            'MATCH (us)-[:STATE_IS]->(uss:UserStatusState) ' +
            'MATCH (u)-[:EMAIL_VERIFY_VIA]->(uev:UserEmailVerification) ' +
            'RETURN u, ul, us, uss, uev',
            { email }
        );

        if (!result.records.length) throw new err.InvalidCredentialsError();

        const savedUser = result.records[0].get('u')?.properties;
        const savedUserLogin = result.records[0].get('ul')?.properties;

        const isPasswordValid = await PwdService.compare(password, savedUserLogin.password);
        if (!isPasswordValid) throw new err.InvalidCredentialsError();

        return {
            token: JwtService.sign(savedUser.uuid),
            user: dto({
                ...savedUser,
                user_status: result.records[0].get('us').properties,
                user_status_state: result.records[0].get('uss').properties,
                user_email_verification: result.records[0].get('uev').properties
            })
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
                'MATCH (u)-[:AUTHORIZE_VIA]->(ul:UserLogin) ' +
                'MATCH (u)-[:STATUS_IS]->(us:UserStatus) ' +
                'MATCH (u)-[:EMAIL_VERIFY_VIA]->(uev:UserEmailVerification) ' +
                'OPTIONAL MATCH (u)-[:RESETTED_BY]->(upr:UserPasswordReset) ' +
                'DETACH DELETE u, ul, us, uev, upr',
                { uuid }
            );

            if (savedUser.avatar_src) {
                await uploader.destroy(savedUser.avatar_src);
            }

        }).catch(error => {
            console.error('transaction', error);
            throw error;
        }).finally(() => {
            session.close();
        });
    }

    /**
     * @function destroyAvatar
     * @description Destroy a user's avatar.
     * @param {Object} options
     * @param {string} options.uuid
     * @returns {Promise<void>}
     */
    async destroyAvatar(options = { uuid: null }) {
        Validator.destroyAvatar(options);

        const { uuid } = options;
        const user = await neodeInstance.model('User').find(uuid);
        if (!user) throw new err.EntityNotFoundError('user');

        const userProps = existingInstance.properties();

        if (userProps.avatar_src) {
            await user.update({ avatar_src: null });
            await uploader.destroy(savedUser.avatar_src);
        }
    }

    /**
     * @function getUserLogins
     * @description Get user logins.
     * @param {Promise<Object>} options
     */
    async getUserLogins(options = { uuid: null }) {
        Validator.getUserLogins(options);

        const user = await neodeInstance.model('User').find(options.uuid);
        if (!user) throw new err.EntityNotFoundError('user');

        const result = await neodeInstance.cypher(
            'MATCH (u:User {uuid: $uuid}) ' +
            'MATCH (u)-[:AUTHORIZE_VIA]->(ul:UserLogin) ' +
            'MATCH (ul)-[:TYPE_IS]->(ult:UserLoginType) ' +
            'RETURN ul, ult',
            { uuid: options.uuid }
        );

        return result.records.map(record => userLoginDto({
            ...record.get('ul').properties,
            user_login_type: record.get('ult').properties
        }));
    }

    /**
     * @function destroyUserLogins
     * @description Destroy user logins.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {string} options.login_uuid
     * @returns {Promise<void>}
     */
    async destroyUserLogins(options = { uuid: null, login_uuid: null }) {
        Validator.destroyUserLogins(options);

        const [userLogin, userLoginResultCount] = await Promise.all([
            neodeInstance.model('UserLogin').find(options.login_uuid),
            neodeInstance.cypher(
                'MATCH (u:User {uuid: $uuid}) ' +
                'MATCH (u)-[:AUTHORIZE_VIA]->(ul:UserLogin) ' +
                'RETURN COUNT(ul) AS user_login_count',
                { uuid: options.uuid }
            )
        ]);
        
        if (!userLogin) throw new err.EntityNotFoundError('user_login');

        const userLoginType = userLogin.get('user_login_type').endNode().properties();
        if (userLoginType.name === 'Password') throw new err.ControllerError(400, 'Cannot delete password login');
        if (userLoginResultCount.records[0].get('user_login_count').low === 1) throw new err.ControllerError(400, 'Cannot delete last login');
        
        await userLogin.delete();
    }

    /**
     * @function createUserLogin
     * @description Create a user login.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.body
     * @param {String} options.body.uuid
     * @param {string} options.body.user_login_type_name
     * @param {string} options.body.password optional
     * @param {string} options.body.third_party_id optional
     * @param {String} options.body.login_uuid optional
     * @returns {Promise<Object>}
     */
    async createUserLogin(options = { uuid: null, body: null }) {
        Validator.createUserLogin(options);

        const { uuid, body } = options;
        const { user_login_type_name } = body;

        const user = await neodeInstance.model('User').find(uuid);
        if (!user) throw new err.EntityNotFoundError('user');

        const userLoginType = await neodeInstance.model('UserLoginType').find(body.user_login_type_name);
        if (!userLoginType) throw new err.EntityNotFoundError('user_login_type');

        if (user_login_type_name === 'Password') {
            if (!body.password) throw new err.ControllerError(400, 'No password provided');
            body.password = await PwdService.hash(body.password);
        } else body.password = null;

        if (user_login_type_name === 'Google') {
            if (!body.third_party_id) throw new err.ControllerError(400, 'No third_party_id provided');
        } else body.third_party_id = null;

        await neodeInstance.batch([
            {
                query: 'MATCH (u:User {uuid: $uuid}) ' +
                    'MATCH (ult:UserLoginType {name: $user_login_type_name}) ' +
                    'CREATE (ul:UserLogin {uuid: $login_uuid, third_party_id: $third_party_id, password: $password}) ' +
                    'CREATE (ul)-[:TYPE_IS]->(ult) ' +
                    'CREATE (u)-[:AUTHORIZE_VIA]->(ul)',
                params: {
                    uuid,
                    user_login_type_name,
                    login_uuid: body.uuid,
                    third_party_id: body.third_party_id,
                    password: body.password
                }
            }
        ])

        const userLogin = await neodeInstance.model('UserLogin').find(body.uuid);

        return userLoginDto({
            ...userLogin.properties(),
            user_login_type: userLoginType.properties()
        });
    }

    /**
     * @function getUserEmailVerification
     * @description Get a user email verification. (mainly for testing)
     * @param {Object} options
     * @param {String} options.uuid
     * @returns {Promise<Object>}
     */    
    async getUserEmailVerification(options = { uuid: null }) {
        Validator.getUserEmailVerification(options);

        const user = await neodeInstance.model('User').find(options.uuid);
        if (!user) throw new err.EntityNotFoundError('user');

        const emailVerificationProps = user.get('user_email_verification').endNode().properties();
        if (!emailVerificationProps) throw new err.EntityNotFoundError('user_email_verification');

        return {
            uuid: emailVerificationProps.uuid,
            is_verified: emailVerificationProps.is_verified
        }
    }
}

const service = new UserService();

export default service;
