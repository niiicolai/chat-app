import Validator from '../../shared/validators/user_email_verification_service_validator.js';
import Mailer from '../../shared/mailers/user_email_verification_mailer.js';
import err from '../../shared/errors/index.js';
import User from '../mongoose/models/user.js';

const WEBSITE_HOST = process.env.WEBSITE_HOST;
if (!WEBSITE_HOST) console.error(`
    WEBSITE_HOST is not defined in the .env file.
    - User email verification is currently not configured correct.
    - Add WEBSITE_HOST=http://localhost:3000 to the .env file.
`);

/**
 * @class UserEmailVerificationService
 * @description Service class for user email verification.
 * @exports UserEmailVerificationService
 */
class UserEmailVerificationService {

    /**
     * @function resend
     * @description Resend a user email verification by user_uuid
     * @param {Object} options
     * @param {String} options.user_uuid
     * @returns {void}
     */
    async resend(options = { user_uuid: null }) {
        Validator.resend(options);

        const { user_uuid: _id } = options;
        const user = await User.findOne({ _id });
        const user_email_verification = user?.user_email_verification;

        if (!user) throw new err.EntityNotFoundError('user');
        if (!user_email_verification) throw new err.EntityNotFoundError('user_email_verification');
        if (user_email_verification.is_verified) throw new err.UserEmailAlreadyVerifiedError();

        const confirmUrl = `${WEBSITE_HOST}/api/v1/mongodb/user_email_verification/${user_email_verification.uuid}/confirm`;
        await (new Mailer({ confirmUrl, username: user.username, to: user.email })).send();
    }

    /**
     * @function confirm
     * @description Confirm a user email verification by user_email_verification_uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @returns {void}
     */
    async confirm(options = { uuid: null }) {
        Validator.confirm(options);

        const { uuid: _id } = options;
        const user = await User.findOne({ 'user_email_verification._id': _id });
        const user_email_verification = user?.user_email_verification;

        if (!user_email_verification) throw new err.EntityNotFoundError('user_email_verification');
        if (user_email_verification.is_verified) throw new err.UserEmailAlreadyVerifiedError();

        user_email_verification.is_verified = true;

        await user.save();
    }
}

const service = new UserEmailVerificationService();

export default service;
