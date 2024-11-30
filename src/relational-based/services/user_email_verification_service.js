import UserEmailVerificationServiceValidator from '../../shared/validators/user_email_verification_service_validator.js';
import UserEmailVerificationMailer from '../../shared/mailers/user_email_verification_mailer.js';
import UserEmailAlreadyVerifiedError from '../../shared/errors/user_email_already_verified_error.js';
import EntityNotFoundError from '../../shared/errors/entity_not_found_error.js';
import db from '../sequelize/models/index.cjs';

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
     * @description Resend a user email verification.
     * @param {Object} options
     * @param {string} options.user_uuid
     * @param {Object} transaction optional
     * @returns {Promise<void>}
     */
    async resend(options = { user_uuid: null }, transaction) {
        UserEmailVerificationServiceValidator.resend(options);

        const steps = async (t) => {
            const user = await db.UserView.findOne({ where: { user_uuid: options.user_uuid }, transaction: t });
            if (!user) throw new EntityNotFoundError('user');

            const userEmailVerification = await db.UserEmailVerificationView.findOne({ 
                where: { user_uuid: options.user_uuid }, 
                transaction: t 
            });

            if (!userEmailVerification) throw new EntityNotFoundError('user_email_verification');
            if (userEmailVerification.user_email_verified) throw new UserEmailAlreadyVerifiedError();

            const confirmUrl = `${WEBSITE_HOST}/api/v1/mysql/user_email_verification/${userEmailVerification.user_email_verification_uuid}/confirm`;
            const mail = new UserEmailVerificationMailer({ confirmUrl, username: user.user_username, to: user.user_email });
            await mail.send();
        }

        if (transaction) await steps(transaction);
        else await db.sequelize.transaction(steps);
    }

    /**
     * @function confirm
     * @description Confirm a user email verification.
     * @param {Object} options
     * @param {string} options.uuid
     * @returns {Promise<void>}
     */
    async confirm(options = { uuid: null }) {
        UserEmailVerificationServiceValidator.confirm(options);

        await db.sequelize.transaction(async (transaction) => {
            const userEmailVerification = await db.UserEmailVerificationView.findOne({
                where: { user_email_verification_uuid: options.uuid },
                transaction
            });
            if (!userEmailVerification) throw new EntityNotFoundError('user_email_verification');
            if (userEmailVerification.user_email_verified) throw new UserEmailAlreadyVerifiedError();

            await db.sequelize.query('CALL set_user_email_verification_proc(:user_uuid, :user_is_verified, @result)', {
                replacements: { user_uuid: userEmailVerification.user_uuid, user_is_verified: true },
                transaction
            });
        });
    }
}

const service = new UserEmailVerificationService();

export default service;
