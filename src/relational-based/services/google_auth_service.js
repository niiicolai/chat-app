import GoogleAuthServiceValidator from '../../shared/validators/google_auth_service_validator.js';
import DuplicateThirdPartyLoginError from '../../shared/errors/duplicate_third_party_login_error.js';
import DuplicateEntryError from '../../shared/errors/duplicate_entry_error.js';
import EntityNotFoundError from '../../shared/errors/entity_not_found_error.js';
import JwtService from '../../shared/services/jwt_service.js';
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
     * @returns {Object}
     */
    async create(options={ info: null }) {
        GoogleAuthServiceValidator.create(options);

        const { id: third_party_id, email } = options.info.data;

        await db.sequelize.transaction(async (transaction) => {
            const [userWithMailExist, userWithThirdPartyIdExist] = await Promise.all([
                db.UserView.findOne({ where: { user_email: email }, transaction }),
                db.UserLoginView.findOne({ where: { user_login_third_party_id: third_party_id }, transaction })
            ]);
            if (userWithMailExist) throw new DuplicateEntryError('user', 'email', email);
            if (userWithThirdPartyIdExist) throw new DuplicateEntryError('user_login', 'third_party_id', third_party_id);

            const replacements = {
                uuid: uuidv4(),
                username: `user${new Date().getTime()}`,
                email,
                password: null,
                avatar: null,
                login_type: 'Google',
                third_party_id
            }

            await db.sequelize.query('CALL create_user_proc(:uuid, :username, :email, :password, :avatar, :login_type, :third_party_id, @result)', {
                replacements,
                transaction
            });

            // Set the email as verified because the user is signing up with Google
            // so we can skip the email verification process
            await db.sequelize.query('CALL set_user_email_verification_proc(:user_uuid, :user_is_verified, @result)', {
                replacements: { user_uuid: replacements.uuid, user_is_verified: true },
                transaction
            });
        });

        return await db.UserView.findOne({ where: { user_email: email } })
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
        GoogleAuthServiceValidator.login(options);

        const { id: third_party_id } = options.info.data;

        const userLogin = await db.UserLoginView.findOne({ where: { 
            user_login_third_party_id: third_party_id,
            user_login_type_name: 'Google'
        }});
        if (!userLogin) throw new EntityNotFoundError('user_login');

        const savedUser = await db.UserView.findOne({ where: { user_uuid: userLogin.user_uuid } });
        if (!savedUser) throw new EntityNotFoundError('user');

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
     * @param {Object} options.user
     * @returns {void}
     */
    async addToExistingUser(options={ third_party_id: null, type: null, user: null }) {
        GoogleAuthServiceValidator.addToExistingUser(options);

        const { third_party_id, type, user } = options;

        await db.sequelize.transaction(async (transaction) => {
            const userLogin = await db.UserLoginView.findOne({ 
                where: { user_uuid: user.uuid, user_login_type_name: 'Google' }, 
                transaction 
            });
            if (userLogin) throw new DuplicateThirdPartyLoginError("Google");

            const replacements = {
                login_uuid: uuidv4(),
                user_uuid: user.uuid,
                login_type: type,
                third_party_id,
                password: null
            }

            await db.sequelize.query('CALL create_user_login_proc(:login_uuid, :user_uuid, :login_type, :third_party_id, :password, @result)', {
                replacements,
                transaction
            });
        });
    }
}

const service = new GoogleAuthService();

export default service;
