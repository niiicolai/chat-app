import UserServiceValidator from '../../shared/validators/user_service_validator.js';
import UserEmailVerificationService from './user_email_verification_service.js';
import UserAvatarUploader from '../../shared/uploaders/user_avatar_uploader.js';
import ControllerError from '../../shared/errors/controller_error.js';
import JwtService from '../../shared/services/jwt_service.js';
import UserStatusState from '../mongoose/models/user_status_state.js';
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

class UserService {

    /**
     * @function findOne
     * @description Find a user by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @returns {Object}
     */
    async findOne(options = { uuid: null }) {
        UserServiceValidator.findOne(options);

        const user = await User.findOne({ uuid: options.uuid })
        if (!user) throw new ControllerError(404, 'User not found');

        return dto(user);
    }

    /**
     * @function create
     * @description Create a user
     * @param {Object} options
     * @param {Object} options.body
     * @param {String} options.body.uuid
     * @param {String} options.body.email
     * @param {String} options.body.username
     * @param {String} options.body.password
     * @param {Object} options.file
     * @returns {Object}
     */
    async create(options = { body: null, file: null }) {
        UserServiceValidator.create(options);
        
        if (await User.findOne({ email: options.body.email })) 
            throw new ControllerError(400, 'Email must be unique');
        if (await User.findOne({ username: options.body.username })) 
            throw new ControllerError(400, 'Username must be unique');
        if (await User.findOne({ uuid: options.body.uuid })) 
            throw new ControllerError(400, 'UUID must be unique');
       
        options.body.password = bcrypt.hashSync(options.body.password, SALT_ROUNDS);

        const [user_status_state, user_login_type] = await Promise.all([
            UserStatusState.findOne({ name: "Offline" }),
            UserLoginType.findOne({ name: "Password" })
        ]);

        if (!user_status_state) throw new ControllerError(500, 'User status state not found');
        if (!user_login_type) throw new ControllerError(500, 'User login type not found');

        const { body, file } = options;
        const { uuid, email, username, password } = body;
        const avatar_src = (file && file.size > 0) ? await uploader.create(file, uuid) : null;
        
        const savedUser = await new User({
            uuid,
            username,
            email,
            avatar_src,
            user_email_verification: { 
                uuid: uuidv4(), 
                is_verified: (process.env.NODE_ENV === 'test')
            },
            user_status: {
                uuid: uuidv4(), 
                last_seen_at: new Date(), 
                message: "No msg yet.", 
                total_online_hours: 0, 
                user_status_state
            },
            user_logins: [{
                uuid: uuidv4(), 
                user_login_type, 
                password: bcrypt.hashSync(password, SALT_ROUNDS)
            }],
            user_password_resets: [],
        }).save();
        
        await UserEmailVerificationService.resend({ user_uuid: uuid });

        return { user: dto(savedUser), token: JwtService.sign(uuid) };
    }

    /**
     * @function update
     * @description Update a user
     * @param {Object} options
     * @param {Object} options.body
     * @param {String} options.body.username
     * @param {String} options.body.email
     * @param {String} options.body.password
     * @param {Object} options.file
     * @param {Object} options.user
     * @returns {Object}
     */
    async update(options = { body: null, file: null, user: null }) {
        UserServiceValidator.update(options);

        const { body, file, user } = options;
        const { sub: uuid } = user;

        const savedUser = await User.findOne({ uuid });
        if (!savedUser) throw new ControllerError(404, 'User not found');

        if (body.username) savedUser.username = body.username;
        if (body.email) savedUser.email = body.email;
        if (file && file.size > 0) 
            savedUser.avatar_src = await uploader.createOrUpdate(savedUser.avatar_src, file, uuid);

        if (body.password) {
            const user_login_type = await UserLoginType.findOne({ name: "Password" });
            let userPasswordLogin = savedUser.user_logins.find(l => l.user_login_type.name === "Password");
            if (!userPasswordLogin) { 
                userPasswordLogin = { uuid: uuidv4(), user_login_type }
                savedUser.user_logins.push(userPasswordLogin);
            }
            userPasswordLogin.password = bcrypt.hashSync(body.password, SALT_ROUNDS);
        }

        await savedUser.save();

        return dto(savedUser);
    }

    /**
     * @function login
     * @description Login a user
     * @param {Object} options
     * @param {Object} options.body
     * @param {String} options.body.email
     * @param {String} options.body.password
     * @returns {Object}
     */
    async login(options = { body: null }) {
        UserServiceValidator.login(options);
        
        const { email, password } = options.body;
        const user = await User.findOne({ email });
        const userLogin = user.user_logins.find(l => l.user_login_type.name === "Password");

        if (!user || !userLogin) throw new ControllerError(400, 'Invalid email or password');
        if (!bcrypt.compareSync(password, userLogin.password)) throw new ControllerError(400, 'Invalid email or password');

        return { user: dto(user), token: JwtService.sign(user.uuid) };
    }

    /**
     * @function destroy
     * @description Destroy a user by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @returns {void}
     */
    async destroy(options = { uuid: null }) {
        UserServiceValidator.destroy(options);

        const { uuid } = options;
        const savedUser = await User.findOne({ uuid });
        if (!savedUser) throw new ControllerError(400, 'User not found');

        await User.findOneAndDelete({ uuid });

        if (savedUser.avatar_src) {
            await uploader.destroy(savedUser.avatar_src);
        }
    }

    /**
     * @function destroyAvatar
     * @description Destroy a user's avatar by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @returns {void}
     */
    async destroyAvatar(options = { uuid: null }) {
        UserServiceValidator.destroyAvatar(options);

        const { uuid } = options;
        const savedUser = await User.findOne({ uuid });
        if (!savedUser) throw new ControllerError(400, 'User not found');

        if (savedUser.avatar_src) {
            await Promise.all([
                User.findOneAndUpdate({ uuid }, { avatar_src: null }),
                uploader.destroy(savedUser.avatar_src)
            ]);
        }
    }
}

const service = new UserService();

export default service;
