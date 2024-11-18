import UserEmailVerificationServiceValidator from '../../shared/validators/user_email_verification_service_validator.js';
import UserEmailVerificationMailer from '../../shared/mailers/user_email_verification_mailer.js';
import ControllerError from '../../shared/errors/controller_error.js';
import User from '../mongoose/models/user.js';

const WEBSITE_HOST = process.env.WEBSITE_HOST;
if (!WEBSITE_HOST) console.error('WEBSITE_HOST is not defined in the .env file.\n  - Email verification is currently not configured correct.\n  - Add WEBSITE_HOST=http://localhost:3000 to the .env file.');

class UserEmailVerificationService {

    /**
     * @function resend
     * @description Resend a user email verification by user_uuid
     * @param {Object} options
     * @param {String} options.user_uuid
     * @returns {void}
     */
    async resend(options = { user_uuid: null }) {
        UserEmailVerificationServiceValidator.resend(options);

        const user = await User.findOne({ uuid: options.user_uuid });
        const user_email_verification = user?.user_email_verification;
        
        if (!user) throw new ControllerError(404, 'User not found');
        if (!user_email_verification) throw new ControllerError(404, 'User email verification not found');
        if (user_email_verification.is_verified) throw new ControllerError(400, 'User email already verified');

        const confirmUrl = `${WEBSITE_HOST}/api/v1/mongodb/user_email_verification/${user_email_verification.uuid}/confirm`;
        await (new UserEmailVerificationMailer({ confirmUrl, username: user.username, to: user.email })).send();
    }

    /**
     * @function confirm
     * @description Confirm a user email verification by user_email_verification_uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @returns {void}
     */
    async confirm(options = { uuid: null }) {
        UserEmailVerificationServiceValidator.confirm(options);

        const user = await User.findOne({ 'user_email_verification.uuid': options.uuid });
        const user_email_verification = user?.user_email_verification;
        
        if (!user) throw new ControllerError(404, 'User email verification not found. Ensure the link is correct.');
        if (!user_email_verification) throw new ControllerError(404, 'User email verification not found. Ensure the link is correct.');

        user_email_verification.is_verified = true;

        await user.save();
    }
}

const service = new UserEmailVerificationService();

export default service;
