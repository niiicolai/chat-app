import GoogleAuthServiceValidator from '../../shared/validators/google_auth_service_validator.js';
import DuplicateThirdPartyLoginError from '../../shared/errors/duplicate_third_party_login_error.js';
import DuplicateEntryError from '../../shared/errors/duplicate_entry_error.js';
import EntityNotFoundError from '../../shared/errors/entity_not_found_error.js';
import ControllerError from '../../shared/errors/controller_error.js';
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
     * @param {String} user_uuid optional
     * @returns {Object}
     */
    async create(options={ info: null, user_uuid: null }) {
        GoogleAuthServiceValidator.create(options);

        const { id: third_party_id, email } = options.info.data;

        await db.sequelize.transaction(async (transaction) => {
            await Promise.all([
                db.UserView.findOne({ where: { user_email: email }, transaction }),
                db.UserLoginView.findOne({ where: { user_login_third_party_id: third_party_id }, transaction })
            ]).then(([userWithMailExist, userWithThirdPartyIdExist]) => {
                if (userWithMailExist) throw new DuplicateEntryError('user', 'email', email);
                if (userWithThirdPartyIdExist) throw new DuplicateEntryError('user_login', 'third_party_id', third_party_id);
            });

            const uuid = options.user_uuid || uuidv4();
            const username = `user${new Date().getTime()}`;
            const login_type = 'Google';

            await db.UserView.createUserProcStatic({
                uuid,
                username,
                email,
                login_type,
                third_party_id
            }, transaction);

            // Set the email as verified because the user is signing up with Google
            // so we can skip the email verification process
            await db.UserView.setUserEmailVerificationProcStatic({
                user_uuid: uuid,
                is_verified: true
            }, transaction);
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
        GoogleAuthServiceValidator.login(options);

        const { id: third_party_id } = options.info.data;

        console.log('third_party_id', third_party_id);
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
     * @param {Object} options.login_uuid optional
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {void}
     */
    async addToExistingUser(options={ third_party_id: null, type: null, user: null, login_uuid: null }) {
        GoogleAuthServiceValidator.addToExistingUser(options);

        const { third_party_id, type, user } = options;

        if (type !== 'Google') throw new ControllerError(400, 'Only Google are currently supported');

        await db.sequelize.transaction(async (transaction) => {
            const userLogin = await db.UserLoginView.findOne({ 
                where: { user_uuid: user.sub, user_login_type_name: type }, 
                transaction 
            });
            if (userLogin) throw new DuplicateThirdPartyLoginError(type);

            await db.UserView.createUserLoginProcStatic({
                login_uuid: options.login_uuid || uuidv4(),
                user_uuid: user.sub,
                user_login_type_name: type,
                third_party_id
            }, transaction);
        });
    }
}

const service = new GoogleAuthService();

export default service;
