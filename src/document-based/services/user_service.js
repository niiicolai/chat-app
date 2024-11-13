
import UserEmailVerificationService from './user_email_verification_service.js';
import UserAvatarUploader from '../../shared/uploaders/user_avatar_uploader.js';
import ControllerError from '../../shared/errors/controller_error.js';
import MongodbBaseFindService from './_mongodb_base_find_service.js';
import JwtService from '../../shared/services/jwt_service.js';
import UserEmailVerification from '../mongoose/models/user_email_verification.js';
import UserStatusState from '../mongoose/models/user_status_state.js';
import UserStatus from '../mongoose/models/user_status.js';
import UserLogin from '../mongoose/models/user_login.js';
import UserLoginType from '../mongoose/models/user_login_type.js';
import User from '../mongoose/models/user.js';
import dto from '../dto/user_dto.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const SALT_ROUNDS = 10;
const uploader = new UserAvatarUploader();

console.warn('MongoDB TODO (user_service.js)');
console.warn('Users cannot revoke their Google sign in');
console.warn('Users with passwords cannot add Google sign in');

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
        if (await User.findOne({ email: options.body.email })) throw new ControllerError(400, 'Email must be unique');
        if (await User.findOne({ username: options.body.username })) throw new ControllerError(400, 'Username must be unique');
        if (await User.findOne({ uuid: options.body.uuid })) throw new ControllerError(400, 'UUID must be unique');
        if (!options.body.password) throw new ControllerError(400, 'No password provided');
        else options.body.password = bcrypt.hashSync(options.body.password, SALT_ROUNDS);

        const { body, file } = options;
        const { uuid, email, username, password } = body;

        const userStatusState = await UserStatusState.findOne({ name: "Offline" });
        if (!userStatusState) throw new ControllerError(500, 'User status state not found');

        const avatar_src = (file && file.size > 0) ? await uploader.create(file, uuid) : null;

        const userLoginType = await UserLoginType.findOne({ name: "Password" });
        if (!userLoginType) throw new ControllerError(500, 'User login type not found');

        const userStatus = await new UserStatus({ 
            uuid: uuidv4(), 
            last_seen_at: new Date(), 
            message: "No msg yet.", 
            total_online_hours: 0, 
            user_status_state: userStatusState._id 
        }).save();

        const userEmailVerification = await new UserEmailVerification({ 
            uuid: uuidv4(), 
            is_verified: (process.env.NODE_ENV === 'test')
        }).save();
        
        const savedUser = await new User({
            uuid,
            username,
            email,
            avatar_src,
            user_email_verification: userEmailVerification._id,
            user_status: userStatus._id
        }).save();

        await new UserLogin({ uuid: uuidv4(), user: savedUser._id, user_login_type: userLoginType._id, password }).save();
        await UserEmailVerificationService.resend({ user_uuid: uuid });

        return { user: await this.findOne({ uuid }), token: JwtService.sign(uuid) };
    }

    async update(options = { body: null, file: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(400, 'No user UUID provided');

        const { body, file, user } = options;
        const { sub: uuid } = user;

        const savedUser = await User.findOne({ uuid });
        if (!savedUser) throw new ControllerError(404, 'User not found');

        const params = {};
        if (body.username) params.username = body.username;
        if (body.email) params.email = body.email;
        if (file && file.size > 0) params.avatar_src = await uploader.createOrUpdate(savedUser.avatar_src, file, uuid);

        await savedUser.updateOne(params);

        const password = body.password ? bcrypt.hashSync(body.password, SALT_ROUNDS) : null;
        const userLoginType = await UserLoginType.findOne({ name: "Password" });
        const userLogin = await UserLogin.findOne({ user: savedUser._id, user_login_type: userLoginType._id });
        if (userLogin && password) await userLogin.updateOne({ password });
        else if (!userLogin && body.password) await new UserLogin({ uuid: uuidv4(), user: savedUser._id, user_login_type: userLoginType._id, password }).save();

        return this.findOne({ uuid });
    }

    async login(options = { body: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.body.email) throw new ControllerError(400, 'No email provided');
        if (!options.body.password) throw new ControllerError(400, 'No password provided');
        
        const { email, password } = options.body;
        const user = await User.findOne({ email })
            .populate('user_email_verification')
            .populate('user_status');

        const userLoginType = await UserLoginType.findOne({ name: "Password" });
        const userLogin = await UserLogin.findOne({ user: user._id, user_login_type: userLoginType._id });
        if (!user || !userLogin || !await bcrypt.compare(password, userLogin.password)) {
            throw new ControllerError(400, 'Invalid email or password');
        }

        return { user: this.dto(user), token: JwtService.sign(user.uuid) };
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

        if (savedUser.avatar_src) {
            await User.findOneAndUpdate({ uuid }, { avatar_src: null });
            await uploader.destroy(savedUser.avatar_src);
        }
    }
}

const service = new UserService();

export default service;
