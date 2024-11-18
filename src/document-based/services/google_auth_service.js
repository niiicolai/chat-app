import GoogleAuthServiceValidator from '../../shared/validators/google_auth_service_validator.js';
import JwtService from '../../shared/services/jwt_service.js';
import ControllerError from '../../shared/errors/controller_error.js';
import UserLoginType from '../mongoose/models/user_login_type.js';
import UserStatusState from '../mongoose/models/user_status_state.js';
import User from '../mongoose/models/user.js';
import dto from '../dto/user_dto.js';
import { v4 as uuidv4 } from 'uuid';

class Service {

    /**
     * @function create
     * @description Create a user with Google account
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

        const { id: third_party_id, email, picture: avatar_src } = options.info.data;

        if (await User.findOne({ email })) 
            throw new ControllerError(400, 'Account already linked already exists. Please login instead!');
        if (await User.findOne({ user_logins: { $elemMatch: { 
            'user_login_type.name': "Google",
            third_party_id: options.third_party_id
        }}})) throw new ControllerError(400, 'Account already linked already exists. Please login instead!');
        
        const [user_status_state, user_login_type] = await Promise.all([
            UserStatusState.findOne({ name: "Offline" }),
            UserLoginType.findOne({ name: "Google" })
        ]);

        if (!user_status_state) throw new ControllerError(500, 'User status state not found');
        if (!user_login_type) throw new ControllerError(500, 'User login type not found');

        const now = new Date();
        const uuid = uuidv4();
        const username = `user${now.getTime()}`;
        const savedUser = await new User({
            uuid,
            username,
            email,
            avatar_src,
            user_email_verification: { 
                uuid: uuidv4(), 
                is_verified: true
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
                third_party_id
            }],
            user_password_resets: []    
        }).save();

        return { user: dto(savedUser), token: JwtService.sign(uuid) }
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
        GoogleAuthServiceValidator.login(options);

        const user = await User.findOne({ user_logins: { $elemMatch: { 
            'user_login_type.name': "Google",
            third_party_id: options.info.data.id
        }}});

        if (!user) throw new ControllerError(400, 'User not found');

        return { token: JwtService.sign(user.uuid), user: dto(user) };
    }
}

const service = new Service();

export default service;
