import UserServiceValidator from '../../shared/validators/user_service_validator.js';
import UserEmailVerificationService from './user_email_verification_service.js';
import UserAvatarUploader from '../../shared/uploaders/user_avatar_uploader.js';
import ControllerError from '../../shared/errors/controller_error.js';
import NeodeBaseFindService from './neode_base_find_service.js';
import JwtService from '../../shared/services/jwt_service.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/user_dto.js';
import userLoginDto from '../dto/user_login_dto.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const SALT_ROUNDS = 10;
const uploader = new UserAvatarUploader();

class UserService extends NeodeBaseFindService {
    constructor() {
        super('uuid', 'User', dto);
    }

    async findOne(options = { uuid: null }) {
        UserServiceValidator.findOne(options);

        const user = await neodeInstance.model("User").find(options.uuid);
        if (!user) throw new ControllerError(404, 'User not found');

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

    async create(options = { body: null, file: null }) {
        UserServiceValidator.create(options);

        if ((await neodeInstance.cypher('MATCH (u:User) WHERE u.email = $email RETURN u', { email: options.body.email })).records.length > 0) {
            throw new ControllerError(400, 'Email must be unique');
        }
        if ((await neodeInstance.cypher('MATCH (u:User) WHERE u.username = $username RETURN u', { username: options.body.username })).records.length > 0) {
            throw new ControllerError(400, 'Username must be unique');
        }
        if ((await neodeInstance.cypher('MATCH (u:User) WHERE u.uuid = $uuid RETURN u', { uuid: options.body.uuid })).records.length > 0) {
            throw new ControllerError(400, 'UUID must be unique');
        }

        options.body.password = bcrypt.hashSync(options.body.password, SALT_ROUNDS);

        const { body, file } = options;
        const { uuid, email, username, password } = body;

        const userLoginType = await neodeInstance.model('UserLoginType').find('Password');
        if (!userLoginType) throw new ControllerError(500, 'User login type not found');

        const userStatusState = await neodeInstance.model('UserStatusState').find('Offline');
        if (!userStatusState) throw new ControllerError(500, 'User status state not found');

        const avatar_src = (file && file.size > 0) ? await uploader.create(file, uuid) : null;

        const userLogin = await neodeInstance.model('UserLogin').create({
            uuid: uuidv4(),
            password,
        });

        const userState = await neodeInstance.model('UserStatus').create({
            last_seen_at: new Date(),
            message: "No message",
            total_online_hours: 0,
            created_at: new Date(),
            updated_at: new Date()
        });

        const userEmailVerification = await neodeInstance.model('UserEmailVerification').create({
            uuid: uuidv4(),
            is_verified: (process.env.NODE_ENV === 'test'), // Set the email as verified if the environment is test
            created_at: new Date(),
            updated_at: new Date()
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
        await UserEmailVerificationService.resend({ user_uuid: uuid });

        return {
            token: JwtService.sign(uuid),
            user: this.dto(savedUser.properties(), [
                { user_status: userState.properties() },
                { user_email_verification: userEmailVerification.properties() }
            ]),
        };
    }

    async update(options = { body: null, file: null, user: null }) {
        UserServiceValidator.update(options);

        const { body, file, user } = options;
        const { sub: uuid } = user;

        const existingInstance = await neodeInstance.model('User').find(uuid);
        if (!existingInstance) throw new ControllerError(404, 'User not found');
        const existing = existingInstance.properties();

        const params = {};
        if (body.username) params.username = body.username;
        if (body.email) params.email = body.email;
        if (file && file.size > 0) params.avatar_src = await uploader.createOrUpdate(existing.avatar_src, file, uuid);
        await existingInstance.update(params);

        if (body.password) {
            const password =  bcrypt.hashSync(body.password, SALT_ROUNDS);
            const userLoginType = await neodeInstance.model('UserLoginType').find('Password');
            const userLogin = await neodeInstance.cypher(
                'MATCH (ul:UserLogin)-[:HAS_USER]->(u:User {uuid: $uuid}) ' +
                'MATCH (ul)-[:HAS_LOGIN_TYPE]->(ult:UserLoginType {name: "Password"}) ' +
                'RETURN ul, ult',
                { uuid }
            )
                .then(result => result?.records[0]?.get('ul').properties);
            if (userLogin && password) await userLogin.update({ password });
            else if (!userLogin && body.password) await neodeInstance.model('UserLogin')
                .create({ uuid: uuidv4(), password })
                .relateTo(existingInstance, 'user')
                .relateTo(userLoginType, 'user_login_type');
        }

        return this.findOne({ uuid });
    }

    async login(options = { body: null }) {
        UserServiceValidator.login(options);

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
            user: this.dto(savedUser, [
                { user_status: result?.records[0]?.get('us').properties },
                { user_email_verification: result?.records[0]?.get('uev').properties },
                { user_status_state: result?.records[0]?.get('uss').properties }
            ])
        };
    }

    async destroy(options = { uuid: null }) {
        UserServiceValidator.destroy(options);

        const { uuid } = options;
        const existingInstance = await neodeInstance.model('User').find(uuid);
        if (!existingInstance) throw new ControllerError(400, 'User not found');

        const savedUser = existingInstance.properties();
        if (savedUser.avatar_src) {
            await uploader.destroy(savedUser.avatar_src);
        }

        await existingInstance.delete();

        console.warn('TODO: implement destroy relations in user_service.js destroy method');
    }

    async destroyAvatar(options = { uuid: null }) {
        UserServiceValidator.destroyAvatar(options);

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
        UserServiceValidator.getUserLogins(options);

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
        UserServiceValidator.destroyUserLogins(options);

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
}

const service = new UserService();

export default service;
