
import UserEmailVerificationService from './user_email_verification_service.js';
import UserAvatarUploader from '../../shared/uploaders/user_avatar_uploader.js';
import ControllerError from '../../shared/errors/controller_error.js';
import MongodbBaseFindService from './_mongodb_base_find_service.js';
import JwtService from '../../shared/services/jwt_service.js';
import UserEmailVerification from '../mongoose/models/user_email_verification.js';
import UserStatusState from '../mongoose/models/user_status_state.js';
import UserStatus from '../mongoose/models/user_status.js';
import User from '../mongoose/models/user.js';
import dto from '../dto/user_dto.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const SALT_ROUNDS = 10;
const uploader = new UserAvatarUploader();

class UserService extends MongodbBaseFindService {
    constructor() {
        super(User, dto, 'uuid');
    }

    async findOne(options = { uuid: null }) {
        return super.findOne(options, (query) => query
            .populate('user_email_verification')
            .populate('user_status'));
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

        if (await User.findOne({ email: body.email })) {
            throw new ControllerError(400, 'Email already exists');
        }

        if (await User.findOne({ username: body.username })) {
            throw new ControllerError(400, 'Username already exists');
        }

        if (await User.findOne({ uuid: body.uuid })) {
            throw new ControllerError(400, 'UUID already exists');
        }

        const userStatusState = await UserStatusState.findOne({ name: "Offline" });
        if (!userStatusState) {
            throw new ControllerError(500, 'User status state not found');
        }

        const userStatus = await new UserStatus({ 
            uuid: uuidv4(), 
            last_seen_at: new Date(), 
            message: "No msg yet.", 
            total_online_hours: 0, 
            user_status_state: userStatusState._id 
        }).save();

        const userEmailVerification = await new UserEmailVerification({ 
            uuid: uuidv4(), 
            is_verified: false 
        }).save();
        
        const { uuid, email, username, password } = body;
        const { file } = options;
        const avatar_src = (file && file.size > 0) ? await uploader.create(file, uuid) : null;
        
        const savedUser = await new User({
            uuid,
            username,
            email,
            password,
            avatar_src,
            user_email_verification: userEmailVerification._id,
            user_status: userStatus._id
        }).save();

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

        const existing = await User.findOne({ uuid });
        if (!existing) throw new ControllerError(404, 'User not found');

        if (!body.username) body.username = existing.username;
        if (!body.email) body.email = existing.email;
        if (!body.password) body.password = existing.password;
        else body.password = bcrypt.hashSync(body.password, SALT_ROUNDS);

        const { username, email, password } = body;
        const avatar_src = (file && file.size > 0) 
            ? await uploader.createOrUpdate(existing.avatar_src, file, uuid)
            : existing.avatar_src;

        await existing.updateOne({ username, email, password, avatar_src });

        return this.findOne({ uuid });
    }

    async login(options = { body: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.body.email) throw new ControllerError(400, 'No email provided');
        if (!options.body.password) throw new ControllerError(400, 'No password provided');
        
        const { email, password } = options.body;
        const savedUser = await User.findOne({ email });
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
        const savedUser = await User.findOne({ uuid });
        if (!savedUser) throw new ControllerError(400, 'User not found');

        await User.findOneAndDelete({ uuid });

        if (savedUser.avatar_src) {
            await uploader.destroy(savedUser.avatar_src);
        }
    }

    async destroyAvatar(options = { uuid: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No UUID provided');

        const { uuid } = options;
        const savedUser = await User.findOne({ uuid });
        if (!savedUser) throw new ControllerError(400, 'User not found');

        await User.findOneAndUpdate({ uuid }, { avatar_src: null });

        if (savedUser.avatar_src) {
            await uploader.destroy(savedUser.avatar_src);
        }
    }
}

const service = new UserService();

export default service;
