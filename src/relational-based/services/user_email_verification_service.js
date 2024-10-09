import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../sequelize/models/index.cjs';
import ControllerError from '../../shared/errors/controller_error.js';
import MailService from '../../shared/services/mail_service.js';
import dto from '../dto/user_email_verification_dto.js';

const WEBSITE_HOST = process.env.WEBSITE_HOST;
if (!WEBSITE_HOST) {
    throw new Error('ERROR: WEBSITE_HOST not set in .env');
}

const getSubject = () => 'Demo Chat App: Please verify your email address';
const getContent = (verification_uuid, username) => `
Hi ${username},

Please verify your email address by clicking the link below:
${WEBSITE_HOST}/api/v1/mysql/user_email_verification/${verification_uuid}/confirm

If you did not sign up for an account, please ignore this email.

Thanks,
The Team
`;


class UserEmailVerificationService extends MysqlBaseFindService {
    constructor() {
        super(db.UserEmailVerificationView, dto);
    }

    async resend(options = { user_uuid: null }) {
        if (!options.user_uuid) {
            throw new ControllerError(500, 'No user_uuid provided');
        }

        const user = await db.UserView.findOne({ where: { user_uuid: options.user_uuid } });
        if (!user) {
            throw new ControllerError(404, 'User not found');
        }

        const existing = await db.UserEmailVerificationView.findOne({ where: { user_uuid: options.user_uuid } });
        if (!existing) {
            throw new ControllerError(500, 'User has no email verification');
        }

        if (existing.user_email_verified) {
            throw new ControllerError(400, 'User email already verified');
        }

        const verification_uuid = existing.user_email_verification_uuid;
        const username = user.user_username;
        const subject = getSubject();
        const content = getContent(verification_uuid, username);

        await MailService.sendMail(content, subject, user.user_email);
    }

    async confirm(options = { uuid: null }) {
        if (!options.uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }

        const existing = await db.UserEmailVerificationView.findOne({ where: { user_email_verification_uuid: options.uuid } });
        if (!existing) {
            throw new ControllerError(404, 'User email verification not found. Ensure the link is correct.');
        }

        if (existing.user_email_verified) {
            throw new ControllerError(400, 'User email already verified');
        }

        await db.sequelize.query('CALL set_user_email_verification_proc(:user_uuid, :user_is_verified, @result)', {
            replacements: {
                user_uuid: existing.user_uuid,
                user_is_verified: true,
            },
        });
    }
}


const service = new UserEmailVerificationService();

export default service;
