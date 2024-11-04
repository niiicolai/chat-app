import JwtService from '../../shared/services/jwt_service.js';
import ControllerError from '../../shared/errors/controller_error.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/user_dto.js';
import { v4 as uuidv4 } from 'uuid';

class Service {
    async create(options={ info: null }) {
        if (!options.info) throw new ControllerError(500, 'The response from Google is empty');
        if (!options.info.data) throw new ControllerError(500, 'No data in the response from Google');
        if (!options.info.data.email) throw new ControllerError(500, 'No email in the response from Google');
        if (!options.info.data.id) throw new ControllerError(500, 'No id in the response from Google');

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
            replacements: { uuid, username, email, password: null, avatar, login_type, third_party_id }
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

    async login(options={ info: null }) {
        if (!options.info) throw new ControllerError(500, 'The response from Google is empty');
        if (!options.info.data) throw new ControllerError(500, 'No data in the response from Google');
        if (!options.info.data.id) throw new ControllerError(500, 'No id in the response from Google');

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
}

const service = new Service();

export default service;
