import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';
import ControllerError from '../../errors/controller_error.js';
import JwtService from '../jwt_service.js';
import StorageService from '../storage_service.js';
import bcrypt from 'bcrypt';

const saltRounds = 10;
const storage = new StorageService('user_avatar');

const service = new MysqlBaseFindService(
    db.UserView,
    (m) => {
        return {
            uuid: m.user_uuid,
            username: m.user_username,
            email: m.user_email,
            user_avatar_src: m.user_avatar_src,
            created_at: m.user_created_at,
            updated_at: m.user_updated_at,
        };
    }
);


service.create = async (options={ body: null, file: null }) => {
    if (!options.body) {
        throw new ControllerError(400, 'No body provided');
    }
    
    const { body, file } = options;
    
    if (!body.uuid) {
        throw new ControllerError(400, 'No UUID provided');
    }
    if (!body.username) {
        throw new ControllerError(400, 'No username provided');
    }
    if (!body.email) {
        throw new ControllerError(400, 'No email provided');
    }
    if (!body.password) {
        throw new ControllerError(400, 'No password provided');
    }

    if (file) {
        body.user_avatar_src = await storage.uploadFile(file, body.uuid);
    }

    body.password = bcrypt.hashSync(body.password, saltRounds);
    
    await db.sequelize.query('CALL create_user_proc(:uuid, :username, :email, :password, :user_avatar_src, @result)', {
        replacements: {
            uuid: body.uuid,
            username: body.username,
            email: body.email,
            password: body.password,
            user_avatar_src: body.user_avatar_src || null,
        },
    });

    const user = await service.findOne({ user_uuid: body.uuid });
    const token = JwtService.sign(body.uuid);

    return { user, token };
}

service.update = async (options={ body: null, file: null, user: null }) => {
    const { body, file, user } = options;
    const { username, email, password } = body;
    const { sub: user_uuid } = user;

    const existing = await service.model.findOne({
        where: {
            user_uuid,
        },
    });
    if (!existing) {
        throw new ControllerError(404, 'User not found');
    }

    if (!username) {
        body.username = existing.user_username;
    }

    if (!email) {
        body.email = existing.user_email;
    }

    if (!password) {
        body.password = existing.user_password;
    } else {
        body.password = bcrypt.hashSync(body.password, saltRounds);
    }

    if (file) {
        body.user_avatar_src = await storage.uploadFile(file, user_uuid);
    } else {
        body.user_avatar_src = existing.user_user_avatar_src;
    }

    await db.sequelize.query('CALL edit_user_proc(:uuid, :username, :email, :password, :user_avatar_src, @result)', {
        replacements: {
            uuid: user_uuid,
            username: body.username,
            email: body.email,
            password: body.password,
            user_avatar_src: body.user_avatar_src || null,
        },
    });

    return await service.findOne({user_uuid});
}

service.login = async (options={ body: null }) => {
    if (!body.email) {
        throw new ControllerError(400, 'No email provided');
    }
    if (!body.password) {
        throw new ControllerError(400, 'No password provided');
    }

    const user = await db.UserView.findOne({
        where: {
            user_email: body.email,
        },
    });

    if (!user) {
        throw new ControllerError(404, 'User not found');
    }

    if (!await bcrypt.compare(body.password, user.dataValues.user_password)) {
        throw new ControllerError(400, 'Invalid password');
    }

    const token = JwtService.sign(user.dataValues.user_uuid);

    return { user: service.dto(user), token };
}

service.destroy = async (options={ user_uuid: null }) => {
    const { user_uuid } = options;
    
    const user = await service.findOne({user_uuid});
    if (!user) {
        throw new ControllerError(404, 'User not found');
    }

    await db.sequelize.query('CALL delete_user_proc(:user_uuid, @result)', {
        replacements: {
            user_uuid,
        },
    });
}

export default service;
