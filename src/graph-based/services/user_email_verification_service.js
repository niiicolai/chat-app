import Validator from '../../shared/validators/user_email_verification_service_validator.js';
import Mailer from '../../shared/mailers/user_email_verification_mailer.js';
import err from '../../shared/errors/index.js';
import neodeInstance from '../neode/index.js';

const WEBSITE_HOST = process.env.WEBSITE_HOST;
if (!WEBSITE_HOST) console.error(`
    WEBSITE_HOST is not defined in the .env file.
    - User email verification is currently not configured correct.
    - Add WEBSITE_HOST=http://localhost:3000 to the .env file.
`);

/**
 * @class UserEmailVerificationService
 * @description Service class for user email verification
 * @exports UserEmailVerificationService
 */
class UserEmailVerificationService {

    /**
     * @function resend
     * @description Resend a user email verification
     * @param {Object} options
     * @param {String} options.user_uuid
     * @returns {Promise<void>}
     */
    async resend(options = { user_uuid: null }) {
        Validator.resend(options);

        const { user_uuid } = options;
        const user = await neodeInstance.model('User').find(user_uuid);
        if (!user) throw new err.EntityNotFoundError('user');

        const emailVerification = user.get('user_email_verification')?.endNode()?.properties();
        if (!emailVerification) throw new err.EntityNotFoundError('user_email_verification');
        if (emailVerification.is_verified) throw new err.UserEmailAlreadyVerifiedError();

        const userProps = user.properties();
        const confirmUrl = `${WEBSITE_HOST}/api/v1/neo4j/user_email_verification/${emailVerification.uuid}/confirm`;
        const username = userProps.username;
        const to = userProps.email;
        const mail = new Mailer({ confirmUrl, username, to });
        await mail.send();
    }

    /**
     * @function confirm
     * @description Confirm a user email verification
     * @param {Object} options
     * @param {String} options.uuid
     * @returns {Promise<void>}
     */
    async confirm(options = { uuid: null }) {
        Validator.confirm(options);

        const { uuid } = options;
        const userEmailVerification = await neodeInstance.model('UserEmailVerification').find(uuid);
        if (!userEmailVerification) throw new err.EntityNotFoundError('user_email_verification');
        if (userEmailVerification.is_verified) throw new err.UserEmailAlreadyVerifiedError();

        try {
            await userEmailVerification.update({ is_verified: true });
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
}

const service = new UserEmailVerificationService();

export default service;
