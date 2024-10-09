import MongodbBaseFindService from './_mongodb_base_find_service.js';
import ControllerError from '../../shared/errors/controller_error.js';
import MailService from '../../shared/services/mail_service.js';
import dto from '../dto/user_password_reset_dto.js';
import bcrypt from 'bcrypt';
import { v4 as v4uuid } from 'uuid';
import User from '../mongoose/models/user.js';
import UserPasswordReset from '../mongoose/models/user_password_reset.js';

const saltRounds = 10;

const WEBSITE_HOST = process.env.WEBSITE_HOST;
if (!WEBSITE_HOST) {
    throw new Error('ERROR: WEBSITE_HOST not set in .env');
}

const getSubjectCreate = () => 'Demo Chat App: Password Reset';
const getContentCreate = (reset_uuid, username) => `
Hi ${username},

You have requested to reset your password. Please click the link below to reset your password:
${WEBSITE_HOST}/api/v1/mongodb/user_password_reset/${reset_uuid}/reset_password

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

class UserEmailVerificationService extends MongodbBaseFindService {
    constructor() {
        super(UserPasswordReset, dto, 'uuid');
    }

    async create(options = { body: null }) {
        const { body } = options;
        const { email } = body;

        if (!body) throw new ControllerError(400, 'No body provided');
        if (!email) throw new ControllerError(400, 'No email provided');

        const user = await User.findOne({ email: email });
        if (!user) return;

        const uuid = v4uuid();
        const expires_at = new Date();
        expires_at.setHours(expires_at.getHours() + 1);

        await UserPasswordReset.create({
            uuid,
            user: user._id,
            expires_at,
        }).save();

        const subject = getSubjectCreate();
        const content = getContentCreate(uuid, user.username);
        const to = user.email;

        await MailService.sendMail(content, subject, to);
    }

    async resetPassword(options = { uuid: null, body: null }) {
        const { uuid, body } = options;

        if (!uuid) throw new ControllerError(400, 'No uuid provided');
        if (!body) throw new ControllerError(400, 'No body provided');
        if (!body.password) throw new ControllerError(400, 'No password provided');

        const existing = await UserPasswordReset.findOne({ uuid }).populate('user');
        if (!existing) {
            throw new ControllerError(404, 'User password reset not found. Ensure the link is correct.');
        }

        if (existing.expires_at < new Date()) {
            throw new ControllerError(400, 'User password reset has expired. Please request a new link.');
        }

        const subject = getSubjectReset();
        const content = getContentReset(existing.user.username);
        const to = existing.user.email;
        
        await UserPasswordReset.deleteOne({ uuid });
        await User.updateOne({ _id: existing.user._id }, { password: bcrypt.hashSync(body.password, saltRounds) });
        await MailService.sendMail(content, subject, to);
    }
}

const service = new UserEmailVerificationService();

export default service;
