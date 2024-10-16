import UserEmailVerificationService from './user_email_verification_service.js';
import UserAvatarUploader from '../../shared/uploaders/user_avatar_uploader.js';
import ControllerError from '../../shared/errors/controller_error.js';
import MysqlBaseFindService from './_mysql_base_find_service.js';
import JwtService from '../../shared/services/jwt_service.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/user_dto.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const uploader = new UserAvatarUploader();

class UserService extends MysqlBaseFindService {
    constructor() {
        super(db.UserView, dto);
    }

    async create(options = { body: null, file: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.body.uuid) throw new ControllerError(400, 'No UUID provided');
        if (!options.body.username) throw new ControllerError(400, 'No username provided');
        if (!options.body.email) throw new ControllerError(400, 'No email provided');

        if (!options.body.password) throw new ControllerError(400, 'No password provided');
        else options.body.password = bcrypt.hashSync(options.body.password, SALT_ROUNDS);

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

        await db.sequelize.query('CALL create_user_proc(:uuid, :username, :email, :password, :avatar, @result)', {
            replacements: { uuid, username, email, password, avatar },
        });

        await UserEmailVerificationService.resend({ user_uuid: uuid });

        const user = await this.findOne({ uuid });
        const token = JwtService.sign(uuid);

        return { user, token };
    }

    async update(options = { body: null, file: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.user) throw new ControllerError(400, 'No user provided');
        if (!options.user.sub) throw new ControllerError(400, 'No user UUID provided');

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

        if (!body.password) body.password = existing.user_password;
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
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.body.email) throw new ControllerError(400, 'No email provided');
        if (!options.body.password) throw new ControllerError(400, 'No password provided');

        const { email: user_email, password } = options.body;
        const savedUser = await db.UserView.findOne({ where: { user_email }});
        if (!savedUser || !await bcrypt.compare(password, savedUser.dataValues.user_password)) {
            throw new ControllerError(400, 'Invalid email or password');
        }

        const user = this.dto(savedUser);
        const token = JwtService.sign(user.uuid);

        return { user, token };
    }

    async destroy(options = { uuid: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No UUID provided');

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
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No UUID provided');

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
}

const service = new UserService();

export default service;
