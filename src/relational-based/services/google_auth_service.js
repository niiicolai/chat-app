import Validator from '../../shared/validators/google_auth_service_validator.js';
import JwtService from '../../shared/services/jwt_service.js';
import err from '../../shared/errors/index.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/user_dto.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @class GoogleAuthService
 * @description Service class for Google authentication.
 * @exports GoogleAuthService
 */
class GoogleAuthService {

    /**
     * @function create
     * @description Create a user based on their Google account
     * @param {Object} options
     * @param {Object} options.info
     * @param {Object} options.info.data
     * @param {String} options.info.data.id
     * @param {String} options.info.data.email
     * @param {String} user_uuid optional - mainly used by tests to predefine the user UUID
     * @returns {Object}
     */
    async create(options={ info: null, user_uuid: null }) {
        Validator.create(options);

        const { user_uuid } = options;
        const { id: third_party_id, email } = options.info.data;

        await db.sequelize.transaction(async (transaction) => {
            const [userExist, idExist] = await Promise.all([
                db.UserView.findOne({ where: { user_email: email }, transaction }),
                db.UserLoginView.findOne({ where: { user_login_third_party_id: third_party_id }, transaction })
            ]);
            
            if (userExist) throw new err.DuplicateEntryError('user', 'email', email);
            if (idExist) throw new err.DuplicateEntryError('user', 'third_party_id', third_party_id);

            const uuid = user_uuid || uuidv4();
            const username = `user${new Date().getTime()}`;
            const user_login_type_name = 'Google';

            await db.UserView.createUserProcStatic({
                uuid,
                username,
                email,
            }, transaction);

            await db.UserView.createUserLoginProcStatic({
                login_uuid: uuidv4(),
                user_uuid: uuid,
                user_login_type_name,
                third_party_id
            }, transaction);
            
            // Set the email as verified because the user is signing up with Google
            // so we can skip the email verification process
            await db.UserView.setUserEmailVerificationProcStatic({
                user_uuid: uuid,
                is_verified: true
            }, transaction);

        }).catch((error) => {
            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new err.DuplicateEntryError('user', error.errors[0].path, error.errors[0].value);
            } else if (error.name === 'SequelizeForeignKeyConstraintError') {
                throw new err.EntityNotFoundError(error.fields[0]);
            }

            throw error;
        });

        return await db.UserView
            .findOne({ where: { user_email: email } })
            .then(savedUser => {
                const user = dto(savedUser);
                const token = JwtService.sign(user.uuid);
                return { user, token };
            });
    }

    /**
     * @function login
     * @description Login a user based on their Google account
     * @param {Object} options
     * @param {Object} options.info
     * @param {Object} options.info.data
     * @param {String} options.info.data.id
     * @returns {Object}
     */
    async login(options={ info: null }) {
        Validator.login(options);

        const { id: user_login_third_party_id } = options.info.data;
        const user_login_type_name = 'Google';

        const userLogin = await db.UserLoginView.findOne({ where: { 
            user_login_third_party_id,
            user_login_type_name
        }});
        if (!userLogin) throw new err.EntityNotFoundError('user_login');

        const savedUser = await db.UserView.findOne({ where: { user_uuid: userLogin.user_uuid } });
        if (!savedUser) throw new err.EntityNotFoundError('user');

        const user = dto(savedUser);
        const token = JwtService.sign(user.uuid);

        return { user, token };
    }

    /**
     * @function addToExistingUser
     * @description Add a Google account to an existing user
     * @param {Object} options
     * @param {String} options.third_party_id
     * @param {String} options.type
     * @param {Object} options.login_uuid optional
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {void}
     */
    async addToExistingUser(options={ third_party_id: null, type: null, user: null, login_uuid: null }) {
        Validator.addToExistingUser(options);

        const { third_party_id, user, login_uuid, type: user_login_type_name } = options;

        if (user_login_type_name !== 'Google') {
            throw new err.ControllerError(400, 'Only Google are currently supported');
        }

        await db.sequelize.transaction(async (transaction) => {
            const savedUser = await db.UserView.findByPk(user.sub, { transaction });
            if (!savedUser) throw new err.EntityNotFoundError('user');

            const userLogin = await db.UserLoginView.findOne({ 
                where: { user_uuid: user.sub, user_login_type_name }, 
                transaction 
            });
            if (userLogin) throw new err.DuplicateThirdPartyLoginError(user_login_type_name);

            await db.UserView.createUserLoginProcStatic({
                login_uuid: login_uuid || uuidv4(),
                user_uuid: user.sub,
                user_login_type_name,
                third_party_id
            }, transaction);

        }).catch((error) => {
            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new err.DuplicateEntryError('user_login', error.errors[0].path, error.errors[0].value);
            } else if (error.name === 'SequelizeForeignKeyConstraintError') {
                throw new err.EntityNotFoundError(error.fields[0]);
            }

            throw error;
        });
    }
}

const service = new GoogleAuthService();

export default service;
