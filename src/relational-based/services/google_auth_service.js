import GoogleAuthServiceValidator from '../../shared/validators/google_auth_service_validator.js';
import JwtService from '../../shared/services/jwt_service.js';
import ControllerError from '../../shared/errors/controller_error.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/user_dto.js';
import { v4 as uuidv4 } from 'uuid';

class Service {

    /**
     * @function create
     * @description Create a user based on their Google account
     * @param {Object} options
     * @param {Object} options.info
     * @param {Object} options.info.data
     * @param {String} options.info.data.id
     * @param {String} options.info.data.email
     * @param {String} options.info.data.picture
     * @returns {Object}
     */
    async create(options={ info: null }) {
        GoogleAuthServiceValidator.create(options);

        const { id: third_party_id, email, picture: avatar } = options.info.data;

        if (await db.UserView.findOne({ where: { user_email: email } })) {
            throw new ControllerError(400, 'Account already linked already exists. Please login instead!');
        }

        if (await db.UserLoginView.findOne({ where: { user_login_third_party_id: third_party_id } })) {
            throw new ControllerError(400, 'Account already linked already exists. Please login instead!');
        }

        const now = new Date();
        const uuid = uuidv4();
        const username = `user${now.getTime()}`;
        const login_type = 'Google';

        await db.sequelize.query('CALL create_user_proc(:uuid, :username, :email, :password, :avatar, :login_type, :third_party_id, @result)', {
            replacements: { uuid, username, email, password: null, avatar: avatar || null, login_type, third_party_id }
        });
        // Set the email as verified because the user is signing up with Google
        // so we can skip the email verification process
        await db.sequelize.query('CALL set_user_email_verification_proc(:user_uuid, :user_is_verified, @result)', {
            replacements: { user_uuid: uuid, user_is_verified: true }
        });
        
        const savedUser = await db.UserView.findOne({ where: { user_email: email } });
        const user = dto(savedUser);
        const token = JwtService.sign(user.uuid);
        const result = { user, token };

        return result
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
        if (!userLogin) {
            throw new ControllerError(400, 'User not found');
        }

        const savedUser = await db.UserView.findOne({ where: { user_uuid: userLogin.user_uuid } });
        if (!savedUser) {
            throw new ControllerError(400, 'User not found');
        }

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

        if (await db.UserLoginView.findOne({ where: { user_login_third_party_id: third_party_id } })) {
            throw new ControllerError(400, 'Account already linked already exists. Please login instead!');
        }

        if (type !== 'Google') {
            throw new ControllerError(400, 'Only Google are currently supported');
        }

        await db.sequelize.query('CALL create_user_login_proc(:login_uuid, :user_uuid, :login_type, :third_party_id, :password, @result)', {
            replacements: { login_uuid: uuidv4(), user_uuid: user.sub, login_type: type, third_party_id, password: null } 
        });
    }
}

const service = new Service();

export default service;
