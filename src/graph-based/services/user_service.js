
import UserEmailVerificationService from './user_email_verification_service.js';
import UserAvatarUploader from '../../shared/uploaders/user_avatar_uploader.js';
import ControllerError from '../../shared/errors/controller_error.js';
import NeodeBaseFindService from './neode_base_find_service.js';
import JwtService from '../../shared/services/jwt_service.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/user_dto.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const SALT_ROUNDS = 10;
const uploader = new UserAvatarUploader();

console.error('TODO: implement destroy relations in user_service.js destroy method');

class UserService extends NeodeBaseFindService {
    constructor() {
        super('uuid', 'User', dto);
    }

    async findOne(options = { uuid: null }) {
        return super.findOne({ ...options, eager: ['user_status', 'user_email_verification'] });
    }

    async create(options = { body: null, file: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.body.uuid) throw new ControllerError(400, 'No UUID provided');
        if (!options.body.username) throw new ControllerError(400, 'No username provided');
        if (!options.body.email) throw new ControllerError(400, 'No email provided');

        if (!options.body.password) throw new ControllerError(400, 'No password provided');
        else options.body.password = bcrypt.hashSync(options.body.password, SALT_ROUNDS);

        const { body } = options;

        if ((await neodeInstance.cypher('MATCH (u:User) WHERE u.email = $email RETURN u', { email: body.email })).records.length > 0) {
            throw new ControllerError(400, 'Email already exists');
        }

        if ((await neodeInstance.cypher('MATCH (u:User) WHERE u.username = $username RETURN u', { username: body.username })).records.length > 0) {
            throw new ControllerError(400, 'Username already exists');
        }

        if ((await neodeInstance.cypher('MATCH (u:User) WHERE u.uuid = $uuid RETURN u', { uuid: body.uuid })).records.length > 0) {
            throw new ControllerError(400, 'UUID already exists');
        }

        const userStatusState = await neodeInstance.model('UserStatusState').find('Offline');
        if (!userStatusState) {
            throw new ControllerError(500, 'User status state not found');
        }
        
        const { uuid, email, username, password } = body;
        const { file } = options;
        const avatar_src = (file && file.size > 0) ? await uploader.create(file, uuid) : null;

        const userState = await neodeInstance.model('UserStatus').create({
            last_seen_at: new Date(),
            message: "No message",
            total_online_hours: 0,
            created_at: new Date(),
            updated_at: new Date()
        });

        const env = process.env.NODE_ENV || 'development';
        const userEmailVerification = await neodeInstance.model('UserEmailVerification').create({
            uuid: uuidv4(),
            is_verified: (env === 'test'), // Set the email as verified if the environment is test
            created_at: new Date(),
            updated_at: new Date()
        });
        const savedUser = await neodeInstance.model('User').create({
            uuid: uuid,
            username: username,
            email: email,
            password: password,
            avatar_src: avatar_src,
            created_at: new Date(),
            updated_at: new Date()
        });

        await userState.relateTo(userStatusState, 'user_status_state');
        await savedUser.relateTo(userState, 'user_status');
        await savedUser.relateTo(userEmailVerification, 'user_email_verification');

        await UserEmailVerificationService.resend({ user_uuid: uuid });

        const user = this.dto(savedUser);
        const token = JwtService.sign(uuid);

        return { user, token };
    }

    async update(options = { body: null, file: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');

        const { body, file, user } = options;
        const { sub: uuid } = user;

        const existingInstance = await neodeInstance.model('User').find(uuid);
        if (!existingInstance) throw new ControllerError(404, 'User not found');
        const existing = existingInstance.properties();

        if (!body.username) body.username = existing.username;
        if (!body.email) body.email = existing.email;
        if (!body.password) body.password = existing.password;
        else body.password = bcrypt.hashSync(body.password, SALT_ROUNDS);

        const { username, email, password } = body;
        const avatar_src = (file && file.size > 0) 
            ? await uploader.createOrUpdate(existing.avatar_src, file, uuid)
            : existing.avatar_src;

        await existingInstance.update({
            username,
            email,
            password,
            avatar_src,
            updated_at: new Date()
        });

        return this.findOne({ uuid });
    }

    async login(options = { body: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.body.email) throw new ControllerError(400, 'No email provided');
        if (!options.body.password) throw new ControllerError(400, 'No password provided');
        
        const { email, password } = options.body;
        const result = await neodeInstance.cypher('MATCH (u:User) WHERE u.email = $email RETURN u', { email });
        const savedUser = result?.records[0]?.get('u').properties;
        if (!savedUser || !await bcrypt.compare(password, savedUser.password)) {
            throw new ControllerError(400, 'Invalid email or password');
        }

        const token = JwtService.sign(savedUser.uuid);
        const user = this.dto(savedUser);

        return { user, token };
    }

    async destroy(options = { uuid: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No UUID provided');

        const { uuid } = options;
        const existingInstance = await neodeInstance.model('User').find(uuid);
        if (!existingInstance) throw new ControllerError(400, 'User not found');

        const savedUser = existingInstance.properties();
        if (savedUser.avatar_src) {
            await uploader.destroy(savedUser.avatar_src);
        }

        await existingInstance.delete();
    }

    async destroyAvatar(options = { uuid: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No UUID provided');

        const { uuid } = options;
        const existingInstance = await neodeInstance.model('User').find(uuid);
        if (!existingInstance) throw new ControllerError(400, 'User not found');

        await existingInstance.update({ avatar_src: null });

        const savedUser = existingInstance.properties();
        if (savedUser.avatar_src) {
            await uploader.destroy(savedUser.avatar_src);
        }
    }
}

const service = new UserService();

export default service;
