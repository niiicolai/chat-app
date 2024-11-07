import JwtService from '../../shared/services/jwt_service.js';
import ControllerError from '../../shared/errors/controller_error.js';
import UserLoginType from '../mongoose/models/user_login_type.js';
import UserLogin from '../mongoose/models/user_login.js';
import UserStatus from '../mongoose/models/user_status.js';
import UserStatusState from '../mongoose/models/user_status_state.js';
import UserEmailVerification from '../mongoose/models/user_email_verification.js';

import User from '../mongoose/models/user.js';
import dto from '../dto/user_dto.js';
import { v4 as uuidv4 } from 'uuid';

class Service {
    async create(options={ info: null }) {
        if (!options.info) throw new ControllerError(500, 'The response from Google is empty');
        if (!options.info.data) throw new ControllerError(500, 'No data in the response from Google');
        if (!options.info.data.email) throw new ControllerError(500, 'No email in the response from Google');
        if (!options.info.data.id) throw new ControllerError(500, 'No id in the response from Google');

        const { id: third_party_id, email, picture: avatar_src } = options.info.data;

        if (await User.findOne({ email })) throw new ControllerError(400, 'Account already linked already exists. Please login instead!');
        if (await UserLogin.findOne({ third_party_id })) throw new ControllerError(400, 'Account already linked already exists. Please login instead!');
        
        const userStatusState = await UserStatusState.findOne({ name: "Offline" });
        if (!userStatusState) throw new ControllerError(500, 'User status state not found');

        const userLoginType = await UserLoginType.findOne({ name: "Google" });
        if (!userLoginType) throw new ControllerError(500, 'User login type not found');

        const now = new Date();
        const uuid = uuidv4();
        const username = `user${now.getTime()}`;

        const userStatus = await new UserStatus({ 
            uuid: uuidv4(), 
            last_seen_at: new Date(), 
            message: "No msg yet.", 
            total_online_hours: 0, 
            user_status_state: userStatusState._id 
        }).save();

        // Set the email as verified because the user is signing up with Google
        // so we can skip the email verification process
        const userEmailVerification = await new UserEmailVerification({ 
            uuid: uuidv4(), 
            is_verified: true
        }).save();
        
        const savedUser = await new User({
            uuid,
            username,
            email,
            avatar_src,
            user_email_verification: userEmailVerification._id,
            user_status: userStatus._id
        }).save();

        await new UserLogin({ 
            uuid: uuidv4(), 
            user: savedUser._id, 
            user_login_type: userLoginType._id, 
            third_party_id 
        }).save();

        return {
            token: JwtService.sign(uuid),
            user: dto({ ...savedUser, user_status: userStatus, user_email_verification: userEmailVerification })
        }
    }

    async login(options={ info: null }) {
        if (!options.info) throw new ControllerError(500, 'The response from Google is empty');
        if (!options.info.data) throw new ControllerError(500, 'No data in the response from Google');
        if (!options.info.data.id) throw new ControllerError(500, 'No id in the response from Google');

        const { id: third_party_id } = options.info.data;

        const userLoginType = await UserLoginType.findOne({ name: "Google" });
        if (!userLoginType) throw new ControllerError(500, 'User login type not found');

        const userLogin = await UserLogin.findOne({ third_party_id, user_login_type: userLoginType._id });
        if (!userLogin) throw new ControllerError(400, 'User not found');

        const savedUser = await User.findOne({ _id: userLogin.user })
            .populate('user_status')
            .populate('user_email_verification');
        if (!savedUser) throw new ControllerError(400, 'User not found');

        return {
            token: JwtService.sign(savedUser.uuid),
            user: dto({ ...savedUser, 
                user_status: savedUser.user_status, 
                user_email_verification: savedUser.user_email_verification 
            })
        };
    }
}

const service = new Service();

export default service;
