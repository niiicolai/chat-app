import MongodbBaseFindService from './_mongodb_base_find_service.js';
import ControllerError from '../../shared/errors/controller_error.js';
import dto from '../dto/user_password_reset_dto.js';
import bcrypt from 'bcrypt';
import { v4 as v4uuid } from 'uuid';
import User from '../mongoose/models/user.js';
import UserPasswordReset from '../mongoose/models/user_password_reset.js';
import UserCreatePasswordResetMailer from '../../shared/mailers/user_create_password_reset_mailer.js';
import UserConfirmPasswordResetMailer from '../../shared/mailers/user_confirm_password_reset_mailer.js';

const saltRounds = 10;

const WEBSITE_HOST = process.env.WEBSITE_HOST;
if (!WEBSITE_HOST) console.error('WEBSITE_HOST is not defined in the .env file.\n  - Email verification is currently not configured correct.\n  - Add WEBSITE_HOST=http://localhost:3000 to the .env file.');


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

        await new UserPasswordReset({
            uuid,
            user: user._id,
            expires_at,
        }).save();

        const to = user.email;
        const username = user.username;
        const confirmUrl = `${WEBSITE_HOST}/api/v1/mongodb/user_password_reset/${uuid}/reset_password`;
        const mail = new UserCreatePasswordResetMailer({ confirmUrl, username, to });
        await mail.send();
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
        
        await UserPasswordReset.deleteOne({ uuid });
        await User.updateOne({ _id: existing.user._id }, { password: bcrypt.hashSync(body.password, saltRounds) });

        const username = existing.user.username;
        const to = existing.user.email;
        const mail = new UserConfirmPasswordResetMailer({ username, to });
        await mail.send();
    }
}

const service = new UserEmailVerificationService();

export default service;
