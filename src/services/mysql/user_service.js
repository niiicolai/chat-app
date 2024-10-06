import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';
import ControllerError from '../../errors/controller_error.js';
import JwtService from '../jwt_service.js';
import StorageService from '../storage_service.js';
import bcrypt from 'bcrypt';

const saltRounds = 10;
const storage = new StorageService('user_avatar');

class UserService extends MysqlBaseFindService {
    constructor() {
        super(db.UserView, (m) => {
            return {
                uuid: m.user_uuid,
                username: m.user_username,
                email: m.user_email,
                avatar_src: m.user_avatar_src,
                email_verified: m.user_email_verified,
                created_at: m.user_created_at,
                updated_at: m.user_updated_at,
            };
        });
    }

    async create(options = { body: null, file: null }) {
        const { body, file } = options;

        if (!body) {
            throw new ControllerError(400, 'No body provided');
        }

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

        if (file && file.size > 0) {
            if (file.size > parseFloat(process.env.ROOM_UPLOAD_SIZE)) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }
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

        const user = await this.findOne({ uuid: body.uuid });
        const token = JwtService.sign(body.uuid);

        return { user, token };
    }

    async update(options = { body: null, file: null, user: null }) {
        const { body, file, user } = options;
        const { username, email, password } = body;
        const { sub: uuid } = user;

        const existing = await super.findOne({ uuid });

        if (!username) {
            body.username = existing.username;
        }

        if (!email) {
            body.email = existing.email;
        }

        if (!password) {
            body.password = existing.password;
        } else {
            body.password = bcrypt.hashSync(body.password, saltRounds);
        }

        if (file && file.size > 0) {
            if (file.size > parseFloat(process.env.ROOM_UPLOAD_SIZE)) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }
            body.user_avatar_src = await storage.uploadFile(file, uuid);
        } else {
            body.user_avatar_src = existing.user_avatar_src;
        }

        await db.sequelize.query('CALL edit_user_proc(:uuid, :username, :email, :password, :user_avatar_src, @result)', {
            replacements: {
                uuid,
                username: body.username,
                email: body.email,
                password: body.password,
                user_avatar_src: body.user_avatar_src || null,
            },
        });

        return await super.findOne({ uuid });
    }

    async login(options = { body: null }) {
        const { body } = options;

        if (!body) {
            throw new ControllerError(400, 'No body provided');
        }
        if (!body.email) {
            throw new ControllerError(400, 'No email provided');
        }
        if (!body.password) {
            throw new ControllerError(400, 'No password provided');
        }

        const user = await db.UserView.findOne({ where: { user_email: body.email }});

        if (!user || !await bcrypt.compare(body.password, user.dataValues.user_password)) {
            throw new ControllerError(400, 'Invalid email or password');
        }

        const token = JwtService.sign(user.dataValues.user_uuid);

        return { user: this.dto(user), token };
    }

    async destroy(options = { uuid: null }) {
        const { uuid } = options;

        await this.findOne({ uuid });
        await db.sequelize.query('CALL delete_user_proc(:uuid, @result)', {
            replacements: {
                uuid,
            },
        });
    }

    async destroyAvatar(options = { uuid: null }) {
        const { uuid } = options;

        await this.findOne({ uuid });
        await db.sequelize.query('CALL delete_user_avatar_proc(:uuid, @result)', {
            replacements: {
                uuid,
            },
        });
    }
}

const service = new UserService();

export default service;
