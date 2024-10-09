import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../sequelize/models/index.cjs';
import ControllerError from '../../shared/errors/controller_error.js';
import MailService from '../../shared/services/mail_service.js';
import dto from '../dto/user_password_reset_dto.js';
import bcrypt from 'bcrypt';
import { v4 as v4uuid } from 'uuid';

const saltRounds = 10;

const WEBSITE_HOST = process.env.WEBSITE_HOST;
if (!WEBSITE_HOST) {
    throw new Error('ERROR: WEBSITE_HOST not set in .env');
}

const getSubjectCreate = () => 'Demo Chat App: Password Reset';
const getContentCreate = (reset_uuid, username) => `
Hi ${username},

You have requested to reset your password. Please click the link below to reset your password:
${WEBSITE_HOST}/api/v1/mysql/user_password_reset/${reset_uuid}/reset_password

This link will expire in 1 hour.

If you did not request to reset your password, please ignore this email.

Thanks,
The Team
`;

const getSubjectReset = () => 'Demo Chat App: Password Reset Successful';
const getContentReset = (username) => `
Hi ${username},

Your password has been successfully reset.

If you did not request to reset your password, please contact us immediately.

Thanks,
The Team
`;

class UserEmailVerificationService extends MysqlBaseFindService {
    constructor() {
        super(db.UserPasswordResetView, dto);
    }

    async create(options = { body: null }) {
        const { body } = options;
        if (!body) {
            throw new ControllerError(400, 'No body provided');
        }
        
        const { email } = body;
        if (!email) {
            throw new ControllerError(400, 'No email provided');
        }

        const user = await db.UserView.findOne({ where: { user_email: email } });
        if (!user) {
            return;
        }

        const uuid = v4uuid();
        const user_uuid = user.user_uuid;
        const expires_at = new Date();
        expires_at.setHours(expires_at.getHours() + 1);

        await db.sequelize.query('CALL create_user_password_reset_proc(:uuid, :user_uuid, :expires_at, @result)', {
            replacements: {
                uuid,
                user_uuid,
                expires_at,
            },
        });

        const subject = getSubjectCreate();
        const content = getContentCreate(uuid, user.user_username);
        const to = user.user_email;

        await MailService.sendMail(content, subject, to);
    }

    async resetPassword(options = { uuid: null, body: null }) {
        const { uuid, body } = options;

        if (!uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }
        if (!body) {
            throw new ControllerError(400, 'No body provided');
        }
        if (!body.password) {
            throw new ControllerError(400, 'No password provided');
        }

        body.password = bcrypt.hashSync(body.password, saltRounds);

        const existing = await db.UserPasswordResetView.findOne({ where: { user_password_reset_uuid: uuid } });
        if (!existing) {
            throw new ControllerError(404, 'User password reset not found. Ensure the link is correct.');
        }

        await db.sequelize.query('CALL delete_user_password_reset_proc(:uuid, @result)', {
            replacements: {
                uuid,
            },
        });

        const user = await db.UserView.findOne({ where: { user_uuid: existing.user_uuid } });
        await db.sequelize.query('CALL edit_user_proc(:uuid, :username, :email, :password, :user_avatar_src, @result)', {
            replacements: {
                uuid: user.user_uuid,
                username: user.user_username,
                email: user.user_email,
                password: body.password,
                user_avatar_src: user.user_avatar_src || null,
            },
        });

        const subject = getSubjectReset();
        const content = getContentReset(user.user_username);
        const to = user.user_email;

        await MailService.sendMail(content, subject, to);
    }
}

const service = new UserEmailVerificationService();

export default service;