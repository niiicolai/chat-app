import UserPasswordResetServiceValidator from '../../shared/validators/user_password_reset_service_validator.js';
import UserCreatePasswordResetMailer from '../../shared/mailers/user_create_password_reset_mailer.js';
import UserConfirmPasswordResetMailer from '../../shared/mailers/user_confirm_password_reset_mailer.js';
import ControllerError from '../../shared/errors/controller_error.js';
import UserLoginType from '../mongoose/models/user_login_type.js';
import User from '../mongoose/models/user.js';
import bcrypt from 'bcrypt';
import { v4 as v4uuid } from 'uuid';

const saltRounds = 10;

const WEBSITE_HOST = process.env.WEBSITE_HOST;
if (!WEBSITE_HOST) console.error('WEBSITE_HOST is not defined in the .env file.\n  - Email verification is currently not configured correct.\n  - Add WEBSITE_HOST=http://localhost:3000 to the .env file.');

class UserPasswordResetService {

    /**
     * @function create
     * @description Create a user password reset by email
     * @param {Object} options
     * @param {Object} options.body
     * @param {String} options.body.email
     * @returns {void}
     */
    async create(options = { body: null }) {
        UserPasswordResetServiceValidator.create(options);

        const { email } = options.body;
        const user = await User.findOne({ email });
        if (!user) return;

        const uuid = v4uuid();
        const confirmUrl = `${WEBSITE_HOST}/api/v1/mongodb/user_password_reset/${uuid}/reset_password`;

        user.user_password_resets.push({ uuid, expires_at: UserPasswordResetService.createExpireAtDate() })

        await Promise.all([
            user.save(),
            new UserCreatePasswordResetMailer({ confirmUrl, username: user.username, to: email }).send()
        ]);
    }

    /**
     * @function resetPassword
     * @description Reset a user password by reset password uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.body
     * @param {String} options.body.password
     * @returns {void}
     */
    async resetPassword(options = { uuid: null, body: null }) {
        UserPasswordResetServiceValidator.resetPassword(options);

        const { uuid, body } = options;
        const user = await User.findOne({ user_password_resets: { $elemMatch: { uuid } } });
        const user_password_reset = user?.user_password_resets?.find(u => u.uuid === uuid);

        if (!user) 
            throw new ControllerError(404, 'User password reset not found. Ensure the link is correct.');
        if (!user_password_reset) 
            throw new ControllerError(404, 'User password reset not found. Ensure the link is correct.');
        if (user_password_reset.expires_at < new Date()) 
            throw new ControllerError(400, 'User password reset has expired. Please request a new link.');

        let userPasswordLogin = user.user_logins.find(u => u.user_login_type.name === 'Password');
        if (!userPasswordLogin) {
            const user_login_type = await UserLoginType.findOne({ name: 'Password' });
            user.user_logins.push({ 
                uuid: v4uuid(), 
                user_login_type, 
                password: bcrypt.hashSync(body.password, saltRounds) 
            });
        } else {
            userPasswordLogin.password = bcrypt.hashSync(body.password, saltRounds);
        }
        
        user.user_password_resets = user.user_password_resets.filter(u => u.uuid !== uuid);

        await Promise.all([
            user.save(),
            new UserConfirmPasswordResetMailer({ username: user.username, to: user.email }).send()
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
