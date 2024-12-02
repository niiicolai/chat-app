import Validator from '../../shared/validators/user_service_validator.js';
import UserEmailVerificationService from './user_email_verification_service.js';
import UserAvatarUploader from '../../shared/uploaders/user_avatar_uploader.js';
import JwtService from '../../shared/services/jwt_service.js';
import PwdService from '../../shared/services/pwd_service.js';
import err from '../../shared/errors/index.js';
import User from '../mongoose/models/user.js';
import dto from '../dto/user_dto.js';
import userLoginDto from '../dto/user_login_dto.js';
import mongoose from '../mongoose/index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @constant uploader
 * @description User avatar uploader instance
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
     * @description Find a user by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @returns {Object}
     */
    async findOne(options = { uuid: null }) {
        Validator.findOne(options);

        const { uuid: _id } = options;
        const user = await User.findOne({ _id })
        if (!user) throw new err.EntityNotFoundError('user');

        return dto(user._doc);
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
     * @param {Boolean} disableVerifyInTest
     * @returns {Object}
     */
    async create(options = { body: null, file: null }, disableVerifyInTest = false) {
        Validator.create(options);

        const { body, file } = options;
        const { uuid, email, username } = body;

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const avatar_src = (file && file.size > 0) ? await uploader.create(file, uuid) : null;
            const savedUser = await new User({
                _id: uuid,
                username,
                email,
                avatar_src,
                user_email_verification: {
                    _id: uuidv4(),
                    is_verified: (process.env.NODE_ENV === 'test' && !disableVerifyInTest) ? true : false
                },
                user_status: {
                    _id: uuidv4(),
                    last_seen_at: new Date(),
                    message: "No msg yet.",
                    total_online_hours: 0,
                    user_status_state: "Offline"
                },
                user_logins: [{
                    _id: uuidv4(),
                    user_login_type: "Password",
                    password: await PwdService.hash(options.body.password)
                }],
                user_password_resets: []
            }).save({ session });

            if (process.env.NODE_ENV !== 'test') {
                await UserEmailVerificationService.resend({ user_uuid: uuid });
            }

            return { user: dto(savedUser._doc), token: JwtService.sign(uuid) };
        } catch (error) {
            await session.abortTransaction();
            if (error?.errorResponse?.code === 11000) {
                if (error.keyPattern?.email) {
                    throw new err.DuplicateEntryError('user', 'user_email', email);
                } else if (error.keyPattern?.username) {
                    throw new err.DuplicateEntryError('user', 'user_username', username);
                } else if (error.keyPattern?._id) {
                    throw new err.DuplicateEntryError('user', 'PRIMARY', uuid);
                }
            }
            
            throw error;
        } finally {
            if (session.inTransaction()) {
                await session.commitTransaction();
            }
            session.endSession();
        }
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
        Validator.update(options);

        const { body, file, user } = options;
        const { username, email, password } = body;
        const { sub: uuid } = user;

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const savedUser = await User.findOne({ _id: uuid }).session(session);
            if (!savedUser) throw new err.EntityNotFoundError('user');

            if (username) savedUser.username = username;
            if (email) savedUser.email = email;
            if (file && file.size > 0) {
                savedUser.avatar_src = await uploader.createOrUpdate(savedUser.avatar_src, file, uuid);
            }

            if (password) {
                let userPasswordLogin = savedUser.user_logins.find(l => l.user_login_type === "Password");
                if (!userPasswordLogin) {
                    userPasswordLogin = { uuid: uuidv4(), user_login_type: "Password" };
                    savedUser.user_logins.push(userPasswordLogin);
                }

                userPasswordLogin.password = await PwdService.hash(password);
            }

            await savedUser.save({ session });

            return dto(savedUser);

        } catch (error) {
            await session.abortTransaction();
            if (error?.errorResponse?.code === 11000) {
                if (error.keyPattern?.email) {
                    throw new err.DuplicateEntryError('user', 'user_email', email);
                } else if (error.keyPattern?.username) {
                    throw new err.DuplicateEntryError('user', 'user_username', username);
                } else if (error.keyPattern?._id) {
                    throw new err.DuplicateEntryError('user', 'PRIMARY', uuid);
                }
            }

            console.error(error);
            
            throw error;
        } finally {
            if (session.inTransaction()) {
                await session.commitTransaction();
            }
            session.endSession();
        }
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
        Validator.login(options);

        const { email, password } = options.body;

        const user = await User.findOne({ email });
        const userLogin = user?.user_logins?.find(l => l.user_login_type === "Password");

        if (!user || !userLogin) throw new err.InvalidCredentialsError();

        const isPasswordValid = await PwdService.compare(password, userLogin.password);
        if (!isPasswordValid) throw new err.InvalidCredentialsError();

        return { user: dto(user._doc), token: JwtService.sign(user._id) };
    }

    /**
     * @function destroy
     * @description Destroy a user by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @returns {void}
     */
    async destroy(options = { uuid: null }) {
        Validator.destroy(options);

        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const user = await User.findOne({ _id: options.uuid }).session(session);
            if (!user) throw new err.EntityNotFoundError('user');

            await User.deleteOne({ _id: options.uuid }).session(session);

            if (user.avatar_src) {
                const key = uploader.parseKey(user.avatar_src);
                await uploader.destroy(key);
            }

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
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
        Validator.destroyAvatar(options);

        const { uuid } = options;
        const savedUser = await User.findOne({ _id: uuid });
        if (!savedUser) throw new err.EntityNotFoundError('user');

        if (savedUser.avatar_src) {
            await Promise.all([
                User.findOneAndUpdate({ _id: uuid }, { avatar_src: null }),
                uploader.destroy(savedUser.avatar_src)
            ]);
        }
    }

    /**
     * @function getUserLogins
     * @description Get a user's logins by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @returns {Array}
     */
    async getUserLogins(options = { uuid: null }) {
        Validator.getUserLogins(options);

        const user = await User.findOne({ _id: options.uuid });
        if (!user) throw new err.EntityNotFoundError('user');

        return user.user_logins.map(userLoginDto);
    }

    /**
     * @function destroyUserLogins
     * @description Destroy a user's logins by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {String} options.login_uuid
     * @returns {void}
     */
    async destroyUserLogins(options = { uuid: null, login_uuid: null }) {
        Validator.destroyUserLogins(options);

        const { uuid, login_uuid } = options;
        const user = await User.findOne({ _id: uuid });
        const userLogin = user?.user_logins?.find(l => l._id === login_uuid);

        if (!user) throw new err.EntityNotFoundError('user');
        if (!userLogin) throw new err.EntityNotFoundError('user_login');
        if (user.user_logins.length === 1) throw new err.ControllerError(400, 'You cannot delete your last login');
        if (userLogin.user_login_type.name === 'Password') throw new err.ControllerError(400, 'Cannot delete password login');

        user.user_logins = user.user_logins.filter(l => l._id !== login_uuid);

        await user.save();
    }

    async createUserLogin(options = { uuid: null, body: null }) {
        Validator.createUserLogin(options);

        const { uuid, body } = options;
        const { user_login_type_name } = body;

        const user = await User.findOne({ _id: uuid });
        if (!user) throw new err.EntityNotFoundError('user');

        if (user_login_type_name === 'Password') {
            if (!body.password) throw new err.ControllerError(400, 'No password provided');
            body.password = await PwdService.hash(body.password);
        }

        if (user_login_type_name === 'Google') {
            if (!body.third_party_id) throw new err.ControllerError(400, 'No third_party_id provided');
        }

        user.user_logins.push({ user_login_type: body.user_login_type_name, ...body, _id: body.uuid });

        await user.save();

        const userLogin = user.user_logins.find(l => l._id === body.uuid);

        return userLoginDto(userLogin._doc);
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

        const user = await User.findOne({ _id: options.uuid });
        if (!user) throw new err.EntityNotFoundError('user');

        return { uuid: user.user_email_verification._id, is_verified: user.user_email_verification.is_verified };
    }
}

const service = new UserService();

export default service;
