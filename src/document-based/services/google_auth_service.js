import Validator from '../../shared/validators/google_auth_service_validator.js';
import JwtService from '../../shared/services/jwt_service.js';
import err from '../../shared/errors/index.js';
import User from '../mongoose/models/user.js';
import dto from '../dto/user_dto.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @class GoogleAuthService
 * @description Service class for Google auth.
 * @exports GoogleAuthService
 */
class GoogleAuthService {

    /**
     * @function create
     * @description Create a user with Google account
     * @param {Object} options
     * @param {Object} options.info
     * @param {Object} options.info.data
     * @param {String} options.info.data.id
     * @param {String} options.info.data.email
     * @param {String} options.info.data.picture
     * @param {String} user_uuid optional (mainly used by tests to predefine the user UUID)
     * @returns {Object}
     */
    async create(options={ info: null, user_uuid: null }) {
        Validator.create(options);

        const { user_uuid } = options;
        const { id: third_party_id, email } = options.info.data;

        const [userExist, idExist] = await Promise.all([
            User.findOne({ email }),
            User.findOne({ user_logins: { $elemMatch: { 
                'user_login_type': "Google",
                third_party_id
            }}}),
        ]);
        if (userExist) throw new err.DuplicateEntryError('user', 'email', email);
        if (idExist) throw new err.DuplicateEntryError('user', 'third_party_id', third_party_id);

        const now = new Date();
        const uuid = user_uuid || uuidv4();
        const username = `user${now.getTime()}`;
        const savedUser = await new User({
            _id: uuid,
            username,
            email,
            user_email_verification: { 
                _id: uuidv4(), 
                is_verified: true
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
                user_login_type: "Google",
                third_party_id
            }],
            user_password_resets: []    
        }).save();

        return { user: dto(savedUser._doc), token: JwtService.sign(uuid) }
    }

    /**
     * @function login
     * @description Login a user with Google account
     * @param {Object} options
     * @param {Object} options.info
     * @param {Object} options.info.data
     * @param {String} options.info.data.id
     * @returns {Object}
     */
    async login(options={ info: null }) {
        Validator.login(options);

        const { id: third_party_id } = options.info.data;

        const user = await User.findOne({ user_logins: { $elemMatch: {
            'user_login_type': "Google",
            third_party_id
        }}});
        if (!user) throw new err.EntityNotFoundError('user_login');

        return { token: JwtService.sign(user._id), user: dto(user._doc) };
    }

    /**
     * @function addToExistingUser
     * @description Add a Google account to an existing user
     * @param {Object} options
     * @param {String} options.third_party_id
     * @param {String} options.login_uuid optional
     * @param {String} options.type
     * @param {Object} options.user
     * @returns {void}
     */
    async addToExistingUser(options={ third_party_id: null, type: null, user: null, login_uuid: null }) {
        Validator.addToExistingUser(options);

        const { third_party_id, type, user, login_uuid } = options;
        const _id = login_uuid || uuidv4();

        if (type !== 'Google') {
            throw new err.ControllerError(400, 'Only Google are currently supported');
        }

        const userExist = await User.findOne({ _id: user.sub });
        if (!userExist) throw new err.EntityNotFoundError('user');

        const userLogin = await User.findOne({ user_logins: { $elemMatch: { 
            'user_login_type': type,
            third_party_id
        }}});
        if (userLogin) throw new err.DuplicateThirdPartyLoginError("Google");

        await User.updateOne({ _id: user.sub }, {
            $push: { user_logins: { 
                _id,
                user_login_type: type,
                third_party_id
            }}
        });
    }
}

const service = new GoogleAuthService();

export default service;
