import Validator from '../../shared/validators/user_email_verification_service_validator.js';
import Mailer from '../../shared/mailers/user_email_verification_mailer.js';
import err from '../../shared/errors/index.js';
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
        Validator.resend(options);

        const { user_uuid } = options;

        const steps = async (t = null) => {
            const user = await db.UserView.findOne({ 
                where: { user_uuid }, 
                ...(t && { transaction: t }) 
            });
            if (!user) throw new err.EntityNotFoundError('user');

            const userEmailVerification = await db.UserEmailVerificationView.findOne({ 
                where: { user_uuid }, 
                ...(t && { transaction: t })
            });

            if (!userEmailVerification) throw new err.EntityNotFoundError('user_email_verification');
            if (userEmailVerification.user_email_verified) throw new err.UserEmailAlreadyVerifiedError();

            const confirmUrl = `${WEBSITE_HOST}/api/v1/mysql/user_email_verification/${userEmailVerification.user_email_verification_uuid}/confirm`;
            const mail = new Mailer({ confirmUrl, username: user.user_username, to: user.user_email });
            await mail.send();
        }

        if (transaction) await steps(transaction);
        else await steps();
    }

    /**
     * @function confirm
     * @description Confirm a user email verification.
     * @param {Object} options
     * @param {string} options.uuid
     * @returns {Promise<void>}
     */
    async confirm(options = { uuid: null }) {
        Validator.confirm(options);

        const { uuid: user_email_verification_uuid } = options;

        await db.sequelize.transaction(async (transaction) => {
            const userEmailVerification = await db.UserEmailVerificationView.findOne({
                where: { user_email_verification_uuid },
                transaction
            });
            if (!userEmailVerification) throw new err.EntityNotFoundError('user_email_verification');
            if (userEmailVerification.user_email_verified) throw new err.UserEmailAlreadyVerifiedError();

            await db.UserView.setUserEmailVerificationProcStatic({
                user_uuid: userEmailVerification.user_uuid,
                is_verified: true
            }, transaction);
        });
    }
}

const service = new UserEmailVerificationService();

export default service;
