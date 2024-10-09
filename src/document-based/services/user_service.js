import MongodbBaseFindService from './_mongodb_base_find_service.js';
import ControllerError from '../../shared/errors/controller_error.js';
import JwtService from '../../shared/services/jwt_service.js';
import StorageService from '../../shared/services/storage_service.js';
import bcrypt from 'bcrypt';
import dto from '../dto/user_dto.js';
import UserEmailVerificationService from './user_email_verification_service.js';
import User from '../mongoose/models/user.js';
import UserEmailVerification from '../mongoose/models/user_email_verification.js';
import UserStatus from '../mongoose/models/user_status.js';
import UserStatusState from '../mongoose/models/user_status_state.js';
import { v4 as uuidv4 } from 'uuid';

const saltRounds = 10;
const storage = new StorageService('user_avatar');

class UserService extends MongodbBaseFindService {
    constructor() {
        super(User, dto, 'uuid');
    }

    async findOne(options = { uuid: null }) {
        return super.findOne(options, (query) => query.populate('user_email_verification').populate('user_status'));
    }

    async create(options = { body: null, file: null }) {
        const { body, file } = options;

        if (!body) throw new ControllerError(400, 'No body provided');
        if (!body.uuid) throw new ControllerError(400, 'No UUID provided');
        if (!body.username) throw new ControllerError(400, 'No username provided');
        if (!body.email) throw new ControllerError(400, 'No email provided');
        if (!body.password) throw new ControllerError(400, 'No password provided');

        if (await User.findOne({ email: body.email })) {
            throw new ControllerError(400, 'Email already exists');
        }

        if (await User.findOne({ username: body.username })) {
            throw new ControllerError(400, 'Username already exists');
        }

        if (await User.findOne({ uuid: body.uuid })) {
            throw new ControllerError(400, 'UUID already exists');
        }

        if (file && file.size > 0) {
            if (file.size > parseFloat(process.env.ROOM_UPLOAD_SIZE)) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }
            body.avatar_src = await storage.uploadFile(file, body.uuid);
        }
        
        body.password = bcrypt.hashSync(body.password, saltRounds);
        const token = JwtService.sign(body.uuid);
        const userStatusState = await UserStatusState.findOne({ name: "Offline" });
        const userEmailVerification = await new UserEmailVerification({ uuid: uuidv4(), is_verified: false }).save();
        const userStatus = await new UserStatus({ uuid: uuidv4(), last_seen_at: new Date(), message: "No msg yet.", total_online_hours: 0, user_status_state: userStatusState._id }).save();
        const user = await new User({
            uuid: body.uuid,
            username: body.username,
            email: body.email,
            password: body.password,
            avatar_src: body.avatar_src || null,
            user_email_verification: userEmailVerification._id,
            user_status: userStatus._id
        }).save();

        await UserEmailVerificationService.resend({ user_uuid: body.uuid });

        return { user, token };
    }

    async update(options = { body: null, file: null, user: null }) {
        const { body, file, user } = options;
        const { username, email, password } = body;
        const { sub: uuid } = user;

        // Note: This cannot use the service's findOne method
        // because the method is designed not to return the password
        // and in this case, we need the password to ensure if none
        // is provided, we keep the existing password.
        const existing = await User.findOne({ uuid });
        if (!existing) {
            throw new ControllerError(404, 'User not found');
        }

        if (!username) {
            body.username = existing.user_username;
        }

        if (!email) {
            body.email = existing.user_email;
        }

        if (!password) {
            body.password = existing.user_password;
        } else {
            body.password = bcrypt.hashSync(body.password, saltRounds);
        }

        if (file && file.size > 0) {
            if (file.size > parseFloat(process.env.ROOM_UPLOAD_SIZE)) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }
            body.user_avatar_src = await storage.uploadFile(file, uuid);
        } else {
            body.user_avatar_src = existing.avatar_src;
        }

        const updatedUser = await existing.updateOne({
            username: body.username,
            email: body.email,
            password: body.password,
            avatar_src: body.user_avatar_src,
        });

        return this.dto(updatedUser);
    }

    async login(options = { body: null }) {
        const { body } = options;

        if (!body) {
            throw new ControllerError(400, 'No body provided');
        }
        if (!body.email) {
            throw new ControllerError(400, 'No email provided');
        }
        if (!body.password) {
            throw new ControllerError(400, 'No password provided');
        }

        const user = await User.findOne({ email: body.email });
        if (!user || !await bcrypt.compare(body.password, user.password)) {
            throw new ControllerError(400, 'Invalid email or password');
        }

        const token = JwtService.sign(user.uuid);

        return { user: this.dto(user), token };
    }

    async destroy(options = { uuid: null }) {
        const { uuid } = options;

        await this.findOne({ uuid });
        await User.findOneAndDelete({ uuid });
    }

    async destroyAvatar(options = { uuid: null }) {
        const { uuid } = options;

        await this.findOne({ uuid });
        await User.findOneAndUpdate({ uuid }, { avatar_src: null });
    }
}

const service = new UserService();

export default service;
