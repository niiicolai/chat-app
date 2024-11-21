import UserServiceValidator from '../../shared/validators/user_service_validator.js';
import UserEmailVerificationService from './user_email_verification_service.js';
import UserAvatarUploader from '../../shared/uploaders/user_avatar_uploader.js';
import ControllerError from '../../shared/errors/controller_error.js';
import MysqlBaseFindService from './_mysql_base_find_service.js';
import JwtService from '../../shared/services/jwt_service.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/user_dto.js';
import userLoginDto from '../dto/user_login_dto.js';
import bcrypt from 'bcrypt';
import { v4 as uuidV4 } from 'uuid';

const SALT_ROUNDS = 10;
const uploader = new UserAvatarUploader();

class UserService extends MysqlBaseFindService {
    constructor() {
        super(db.UserView, dto);
    }

    async create(options = { body: null, file: null }) {
        UserServiceValidator.create(options);

        options.body.password = bcrypt.hashSync(options.body.password, SALT_ROUNDS);

        const { file } = options;
        const { uuid, email, username, password } = options.body;

        if (await db.UserView.findOne({ where: { user_email: email } })) {
            throw new ControllerError(400, 'Email already exists');
        }
        if (await db.UserView.findOne({ where: { user_username: username } })) {
            throw new ControllerError(400, 'Username already exists');
        }
        if (await db.UserView.findOne({ where: { user_uuid: uuid } })) {
            throw new ControllerError(400, 'UUID already exists');
        }
        
        const avatar = (file && file.size > 0) ? await uploader.create(file, uuid) : null;

        await db.sequelize.query('CALL create_user_proc(:uuid, :username, :email, :password, :avatar, :login_type, :third_party_id, @result)', {
            replacements: { uuid, username, email, password, avatar, login_type: 'Password', third_party_id: null }
        });

        /**
         * Set the email as verified if the environment is test,
         * to avoid having to confirm the email verification
         * when running end-to-end tests.
         */
        const env = process.env.NODE_ENV || 'development';
        if (env === 'test') {
            await db.sequelize.query('CALL set_user_email_verification_proc(:user_uuid, :user_is_verified, @result)', {
                replacements: { user_uuid: uuid, user_is_verified: true }
            });
        } else {
            await UserEmailVerificationService.resend({ user_uuid: uuid });
        }

        const user = await this.findOne({ uuid });
        const token = JwtService.sign(uuid);

        return { user, token };
    }

    async update(options = { body: null, file: null, user: null }) {
        UserServiceValidator.update(options);

        const { body, file, user } = options;
        const { sub: uuid } = user;

        const existing = await db.UserView.findOne({ where: { user_uuid: uuid } });
        if (!existing) throw new ControllerError(404, 'User not found');

        if (body.username && body.username !== existing.user_username && 
            await db.UserView.findOne({ where: { user_username: body.username } })) {
            throw new ControllerError(400, 'Username already exists');
        }

        if (body.email && body.email !== existing.user_email &&
            await db.UserView.findOne({ where: { user_email: body.email } })) {
            throw new ControllerError(400, 'Email already exists');
        }

        if (!body.username) body.username = existing.user_username;
        if (!body.email) body.email = existing.user_email;

        if (!body.password) body.password = existing.user_password || null;
        else body.password = bcrypt.hashSync(body.password, SALT_ROUNDS);

        const { username, email, password } = body;
        const avatar = (file && file.size > 0)  
            ? await uploader.createOrUpdate(existing.user_avatar_src, file, uuid) 
            : existing.user_avatar_src;

        await db.sequelize.query('CALL edit_user_proc(:uuid, :username, :email, :password, :avatar, @result)', {
            replacements: { uuid, username, email, password, avatar },
        });

        return await super.findOne({ uuid });
    }

    async login(options = { body: null }) {
        UserServiceValidator.login(options);

        const { email: user_email, password } = options.body;
        const savedUser = await db.UserView.findOne({ where: { user_email }});
        if (!savedUser) throw new ControllerError(404, 'Invalid email or password');

        const userLogin = await db.UserLoginView.findOne({ where: { 
            user_uuid: savedUser.user_uuid,
            user_login_type_name: 'Password'
        }});
        if (!userLogin) throw new ControllerError(404, 'Invalid email or password');

        if (!await bcrypt.compare(password, userLogin.dataValues.user_login_password)) {
            throw new ControllerError(400, 'Invalid email or password');
        }

        const user = this.dto(savedUser);
        const token = JwtService.sign(user.uuid);

        return { user, token };
    }

    async destroy(options = { uuid: null }) {
        UserServiceValidator.destroy(options);

        const { uuid: user_uuid } = options;
        const savedUser = await db.UserView.findOne({ where: { user_uuid }});
        if (!savedUser) throw new ControllerError(404, 'User not found');

        await db.sequelize.query('CALL delete_user_proc(:user_uuid, @result)', {
            replacements: { user_uuid }
        });

        if (savedUser.user_avatar_src) {
            await uploader.destroy(savedUser.user_avatar_src);
        }
    }

    async destroyAvatar(options = { uuid: null }) {
        UserServiceValidator.destroyAvatar(options);

        const { uuid: user_uuid } = options;
        const savedUser = await db.UserView.findOne({ where: { user_uuid }});
        if (!savedUser) throw new ControllerError(404, 'User not found');
        
        if (savedUser.user_avatar_src) {
            await db.sequelize.query('CALL delete_user_avatar_proc(:user_uuid, @result)', {
                replacements: { user_uuid }
            });

            await uploader.destroy(savedUser.user_avatar_src);
        }
    }

    async getUserLogins(options = { uuid: null }) {
        UserServiceValidator.getUserLogins(options);

        const user = await db.UserView.findOne({ where: { user_uuid: options.uuid }});
        if (!user) throw new ControllerError(404, 'User not found');

        const userLogins = await db.UserLoginView.findAll({ where: { user_uuid: options.uuid }});
        return userLogins.map(userLoginDto);
    }

    async destroyUserLogins(options = { uuid: null, login_uuid: null }) {
        UserServiceValidator.destroyUserLogins(options);

        const { uuid, login_uuid } = options;
        const userLogin = await db.UserLoginView.findOne({ where: { user_uuid: uuid, user_login_uuid: login_uuid }});
        
        if (!userLogin) 
            throw new ControllerError(404, 'User login not found');
        if (userLogin.user_login_type_name === 'Password') 
            throw new ControllerError(400, 'Cannot delete password login');

        const userLogins = await db.UserLoginView.findAll({ where: { user_uuid: options.uuid }});
        if (userLogins.length === 1) throw new ControllerError(400, 'You cannot delete your last login');

        await db.sequelize.query('CALL delete_user_login_proc(:login_uuid, @result)', {
            replacements: { login_uuid }
        });
    }

    async createUserLogin(options = { uuid: null, body: null }) {
        UserServiceValidator.createUserLogin(options);

        const { uuid, body } = options;
        const user = await db.UserView.findOne({ where: { user_uuid: uuid }});
        if (!user) throw new ControllerError(404, 'User not found');

        const loginType = db.UserLoginTypeView.findOne({ where: { user_login_type_name: body.user_login_type_name }});
        if (!loginType) throw new ControllerError(404, 'User login type not found');

        const { user_login_type_name } = body;

        if (user_login_type_name === 'Password') {
            if (!body.password) throw new ControllerError(400, 'No password provided');
            body.password = bcrypt.hashSync(body.password, SALT_ROUNDS);
        } else body.password = null;

        if (user_login_type_name === 'Google') {
            if (!body.third_party_id) throw new ControllerError(400, 'No third_party_id provided');
        } else body.third_party_id = null;
        
        const login_uuid = body.uuid;
        await db.sequelize.query('CALL create_user_login_proc(:login_uuid, :user_uuid, :user_login_type_name, :user_login_password, :third_party_id, @result)', {
            replacements: { login_uuid, user_uuid: uuid, user_login_type_name, third_party_id: body.third_party_id, user_login_password: body.password }
        });

        const userLogin = await db.UserLoginView.findOne({ where: { user_login_uuid: login_uuid }});

        return userLoginDto(userLogin);
    }
}

const service = new UserService();

export default service;
