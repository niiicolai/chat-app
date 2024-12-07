import Validator from '../../shared/validators/user_service_validator.js';
import UserEmailVerificationService from './user_email_verification_service.js';
import UserAvatarUploader from '../../shared/uploaders/user_avatar_uploader.js';
import JwtService from '../../shared/services/jwt_service.js';
import PwdService from '../../shared/services/pwd_service.js';
import err from '../../shared/errors/index.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/user_dto.js';
import userLoginDto from '../dto/user_login_dto.js';
import { v4 as uuidV4 } from 'uuid';

/**
 * @constant uploader
 * @description Instance of UserAvatarUploader.
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
     * @description Find a user by UUID.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null }) {
        Validator.findOne(options);

        const { uuid } = options;
        const entity = await db.UserView.findByPk(uuid);

        if (!entity) throw new err.EntityNotFoundError('user');

        return dto(entity);
    }

    /**
     * @function create
     * @description Create a user.
     * @param {Object} options
     * @param {Object} options.body
     * @param {String} options.body.uuid
     * @param {String} options.body.email
     * @param {String} options.body.username
     * @param {String} options.body.password
     * @param {Object} options.file optional
     * @param {Boolean} disableVerifyInTest optional
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, file: null }, disableVerifyInTest = false) {
        Validator.create(options);

        const { file } = options;
        const { uuid, email, username, password } = options.body;
        const avatar = (file && file.size > 0) ? await uploader.create(file, uuid) : null
        const user_login_password = await PwdService.hash(password);

        await db.sequelize.transaction(async (transaction) => {
            await db.UserView.createUserProcStatic({
                uuid,
                username,
                email,
                avatar,
            }, transaction);

            await db.UserView.createUserLoginProcStatic({
                login_uuid: uuidV4(),
                user_login_type_name: 'Password',
                user_login_password,
                user_uuid: uuid,
            }, transaction);
            
            if (process.env.NODE_ENV === 'test' && !disableVerifyInTest) {
                /**
                 * Set the email as verified if the environment is test,
                 * to avoid having to confirm the email verification
                 * when running end-to-end tests.
                 */
                await db.UserView.setUserEmailVerificationProcStatic({
                    user_uuid: uuid,
                    is_verified: true
                }, transaction);
            } else {
                await UserEmailVerificationService.resend({ user_uuid: uuid }, transaction);
            }
        }).catch((error) => {
            // If an error occurs, delete the new avatar file if it exists.
            if (avatar) uploader.destroy(avatar);

            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new err.DuplicateEntryError('user', error.errors[0].path, error.errors[0].value);
            } else if (error.name === 'SequelizeForeignKeyConstraintError') {
                throw new err.EntityNotFoundError(error.fields[0]);
            }
            console.error(error);
            throw error;
        });

        return await db.UserView
            .findOne({ where: { user_uuid: uuid } })
            .then(entity => dto(entity))
            .then(user => { return { user, token: JwtService.sign(user.uuid) } })
    }

    /**
     * @function update
     * @description Update a user.
     * @param {Object} options
     * @param {Object} options.body
     * @param {String} options.body.username optional
     * @param {String} options.body.email optional
     * @param {String} options.body.password optional
     * @param {Object} options.file optional
     * @param {Object} options.uuid
     * @returns {Promise<Object>}
     */
    async update(options = { body: null, file: null, uuid: null }) {
        Validator.update(options);

        const { body, file, uuid } = options;
        const user_login_password = body.password ? await PwdService.hash(body.password) : null;
        const user_login_type_name = 'Password';
        const user_uuid = uuid;
        const avatar = (file && file.size > 0) ? await uploader.create(file, uuid) : null;

        await db.sequelize.transaction(async (transaction) => {
            const savedUser = await db.UserView.findOne({ 
                where: { user_uuid }, 
                transaction 
            });
            if (!savedUser) throw new err.EntityNotFoundError('user');

            await savedUser.editUserProc({
                ...(body.username && { username: body.username }),
                ...(body.email && { email: body.email }),
                ...(avatar && { avatar })
            }, transaction);

            if (body.password) {
                const userLogin = await db.UserLoginView.findOne({
                    where: { user_uuid, user_login_type_name },
                    transaction
                });
                if (!userLogin) {
                    await db.UserView.createUserLoginProcStatic({
                        login_uuid: uuidV4(),
                        user_login_type_name,
                        user_login_password,
                        user_uuid,
                    }, transaction);
                } else {
                    await userLogin.editUserLoginProc({ user_login_password }, transaction);
                }
            }

            // Old file must be deleted last to prevent database update failures
            // to delete the file if the database update fails.
            if (file && file.size > 0 && savedUser.user_avatar_src) {
                await uploader.destroy(savedUser.user_avatar_src);
            }
        }).catch((error) => {
            // If an error occurs, delete the new avatar file if it exists.
            if (avatar) uploader.destroy(avatar);

            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new err.DuplicateEntryError('user', error.errors[0].path, error.errors[0].value);
            } else if (error.name === 'SequelizeForeignKeyConstraintError') {
                throw new err.EntityNotFoundError(error.fields[0]);
            }
            console.error(error);
            throw error;
        });

        return await db.UserView
            .findOne({ where: { user_uuid } })
            .then(entity => dto(entity));
    }

    /**
     * @function login
     * @description Login a user.
     * @param {Object} options
     * @param {Object} options.body
     * @param {String} options.body.email
     * @param {String} options.body.password
     * @returns {Promise<Object>}
     */
    async login(options = { body: null }) {
        Validator.login(options);

        const { email: user_email, password } = options.body;

        const savedUser = await db.UserView.findOne({ where: { user_email }});
        if (!savedUser) throw new err.InvalidCredentialsError();

        const userLogin = await db.UserLoginView.findOne({ where: { 
            user_uuid: savedUser.user_uuid,
            user_login_type_name: 'Password'
        }});
        if (!userLogin) throw new err.InvalidCredentialsError();

        if (!await PwdService.compare(password, userLogin.dataValues.user_login_password)) {
            throw new err.ControllerError(400, 'Invalid email or password');
        }

        return {
            user: dto(savedUser),
            token: JwtService.sign(savedUser.user_uuid)
        };
    }

    /**
     * @function destroy
     * @description Delete a user.
     * @param {Object} options
     * @param {String} options.uuid
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null }) {
        Validator.destroy(options);

        await db.sequelize.transaction(async (transaction) => {
            const savedUser = await db.UserView.findOne({
                where: { user_uuid: options.uuid },
                transaction
            });
            if (!savedUser) throw new err.EntityNotFoundError('user');

            await savedUser.deleteUserProc(transaction);

            if (savedUser.user_avatar_src) {
                // Delete the user's avatar if it exists.
                await uploader.destroy(savedUser.user_avatar_src);
            }
        });
    }

    /**
     * @function destroyAvatar
     * @description Delete a user's avatar.
     * @param {Object} options
     * @param {String} options.uuid
     * @returns {Promise<void>}
     */
    async destroyAvatar(options = { uuid: null }) {
        Validator.destroyAvatar(options);

        await db.sequelize.transaction(async (transaction) => {
            const savedUser = await db.UserView.findOne({
                where: { user_uuid: options.uuid },
                transaction
            });
            if (!savedUser) throw new err.EntityNotFoundError('user');
            if (savedUser.user_avatar_src) {
                await savedUser.deleteUserAvatarProc(transaction);
                await uploader.destroy(savedUser.user_avatar_src);
            }
        });
    }

    /**
     * @function getUserLogins
     * @description Get a user's logins.
     * @param {Object} options
     * @param {String} options.uuid
     * @returns {Promise<Array>}
     */
    async getUserLogins(options = { uuid: null }) {
        Validator.getUserLogins(options);

        const user = await db.UserView.findOne({ where: { user_uuid: options.uuid }});
        if (!user) throw new err.EntityNotFoundError('user');

        return await db.UserLoginView
            .findAll({ where: { user_uuid: options.uuid }})
            .then(userLogins => userLogins.map(userLoginDto));
    }

    /**
     * @function destroyUserLogins
     * @description Delete a user's logins.
     * @param {Object} options
     * @param {String} options.uuid
     * @param {String} options.login_uuid
     * @returns {Promise<void>}
     */
    async destroyUserLogins(options = { uuid: null, login_uuid: null }) {
        Validator.destroyUserLogins(options);

        const { uuid, login_uuid } = options;

        await db.sequelize.transaction(async (transaction) => {
            const userLogin = await db.UserLoginView.findOne({ 
                where: { user_uuid: uuid, user_login_uuid: login_uuid },
                transaction
            });

            if (!userLogin) throw new err.EntityNotFoundError('user_login');

            if (userLogin.user_login_type_name === 'Password') {
                throw new err.ControllerError(400, 'Cannot delete password login');
            }

            const userLoginCount = await db.UserLoginView.count({ 
                where: { user_uuid: uuid },
                transaction
            });
            if (userLoginCount === 1) {
                throw new err.ControllerError(400, 'Cannot delete last login');
            }

            await userLogin.deleteUserLoginProc(transaction);
        });
    }

    /**
     * @function createUserLogin
     * @description Create a user login.
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.body
     * @param {String} options.body.uuid
     * @param {String} options.body.user_login_type_name
     * @param {String} options.body.password optional
     * @param {String} options.body.third_party_id optional
     * @returns {Promise<Object>}
     */
    async createUserLogin(options = { uuid: null, body: null }) {
        Validator.createUserLogin(options);

        const { uuid, body } = options;

        await db.sequelize.transaction(async (transaction) => {
            const user = await db.UserView.findOne({ 
                where: { user_uuid: uuid },
                transaction
            });
            if (!user) throw new err.EntityNotFoundError('user');

            const loginType = await db.UserLoginTypeView.findOne({
                where: { user_login_type_name: body.user_login_type_name },
                transaction
            });
            if (!loginType) throw new err.EntityNotFoundError('user_login_type');

            if (body.password) {
                body.password = await PwdService.hash(body.password);
            }
            
            await user.createUserLoginProc({
                login_uuid: body.uuid,
                user_login_type_name: body.user_login_type_name,
                ...body.password && { user_login_password: body.password },
                ...body.third_party_id && { third_party_id: body.third_party_id }
            }, transaction);
        });

        return await db.UserLoginView
            .findByPk(body.uuid)
            .then(entity => userLoginDto(entity));
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

        return await db.UserEmailVerificationView
            .findOne({ where: { user_uuid: options.uuid }})
            .then(entity => {
                if (!entity) throw new err.EntityNotFoundError('user_email_verification');
                return { uuid: entity.user_email_verification_uuid, is_verified: (entity.user_email_verified === 1) };
            });
    }
}

const service = new UserService();

export default service;
