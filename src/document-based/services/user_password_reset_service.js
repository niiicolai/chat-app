import Validator from '../../shared/validators/user_password_reset_service_validator.js';
import CreateResetMailer from '../../shared/mailers/user_create_password_reset_mailer.js';
import ConfirmResetMailer from '../../shared/mailers/user_confirm_password_reset_mailer.js';
import PwdService from '../../shared/services/pwd_service.js';
import err from '../../shared/errors/index.js';
import User from '../mongoose/models/user.js';
import { v4 as v4uuid } from 'uuid';

const WEBSITE_HOST = process.env.WEBSITE_HOST;
if (!WEBSITE_HOST) console.error(`
    WEBSITE_HOST is not defined in the .env file.
    - User email verification is currently not configured correct.
    - Add WEBSITE_HOST=http://localhost:3000 to the .env file.
`);

/**
 * @class UserPasswordResetService
 * @description Service class for user password resets.
 * @exports UserPasswordResetService
 */
class UserPasswordResetService {

    /**
     * @function create
     * @description Create a user password reset by email
     * @param {Object} options
     * @param {Object} options.body
     * @param {String} options.body.email
     * @param {String} resetPasswordUuid - optional (mainly used for testing)
     * @returns {Promise<void>}
     */
    async create(options = { body: null }, resetPasswordUuid = null) {
        Validator.create(options);

        const { email } = options.body;
        const user = await User.findOne({ email });
        if (!user) return;

        const uuid = resetPasswordUuid || v4uuid();
        const confirmUrl = `${WEBSITE_HOST}/api/v1/mongodb/user_password_reset/${uuid}/reset_password`;

        user.user_password_resets.push({ _id: uuid, expires_at: UserPasswordResetService.createExpireAtDate() })

        await Promise.all([
            user.save(),
            new CreateResetMailer({ confirmUrl, username: user.username, to: email }).send()
        ]);
    }

    /**
     * @function resetPassword
     * @description Reset a user password by reset password uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.body
     * @param {String} options.body.password
     * @returns {Promise<void>}
     */
    async resetPassword(options = { uuid: null, body: null }) {
        Validator.resetPassword(options);

        const { uuid, body } = options;
        const user = await User.findOne({ user_password_resets: { $elemMatch: { _id: uuid } } });
        const user_password_reset = user?.user_password_resets?.find(u => u._id === uuid);

        if (!user) throw new err.EntityNotFoundError('user');
        if (!user_password_reset) throw new err.EntityNotFoundError('user_password_reset');
        if (user_password_reset.expires_at < new Date()) throw new err.EntityExpiredError('user_password_reset');

        const password = await PwdService.hash(body.password);
        const userPasswordLogin = user.user_logins.find(u => u.user_login_type === 'Password');
        if (!userPasswordLogin) {
            user.user_logins.push({ uuid: v4uuid(), user_login_type: 'Password', password });
        } else {
            user.user_logins = user.user_logins.map(u => {
                if (u.user_login_type === 'Password') u.password = password;
                return u;
            });
        }
        
        user.user_password_resets = user.user_password_resets.filter(u => u._id !== uuid);

        await Promise.all([
            user.save(),
            new ConfirmResetMailer({ username: user.username, to: user.email }).send()
        ]);
    }

    /**
     * @function createExpireAtDate
     * @description Create an expire at date
     * @param {Number} hours
     * @returns {Date}
     */
    static createExpireAtDate(hours = 1) {
        const expires_at = new Date();
        expires_at.setHours(expires_at.getHours() + hours);
        return expires_at;
    }
}

const service = new UserPasswordResetService();

export default service;
