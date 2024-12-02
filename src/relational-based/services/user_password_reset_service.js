import Validator from '../../shared/validators/user_password_reset_service_validator.js';
import CreateResetMailer from '../../shared/mailers/user_create_password_reset_mailer.js';
import ConfirmResetMailer from '../../shared/mailers/user_confirm_password_reset_mailer.js';
import PwdService from '../../shared/services/pwd_service.js';
import err from '../../shared/errors/index.js';
import db from '../sequelize/models/index.cjs';
import { v4 as v4uuid } from 'uuid';

const WEBSITE_HOST = process.env.WEBSITE_HOST;
if (!WEBSITE_HOST) console.error(`
    WEBSITE_HOST is not defined in the .env file.  
    - User password resets is currently not configured correct. 
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
     * @description Create a user password reset.
     * @param {Object} options
     * @param {Object} options.body
     * @param {string} options.body.email
     * @returns {Promise<void>}
     */
    async create(options = { body: null }) {
        Validator.create(options);

        const { email } = options.body;

        await db.sequelize.transaction(async (transaction) => {
            const user = await db.UserView.findOne({ where: { user_email: email }, transaction });
            if (!user) return;

            const uuid = v4uuid();
            const expires_at = new Date();
            expires_at.setHours(expires_at.getHours() + 1);

            await user.createUserPasswordResetProc({
                uuid,
                expires_at,
            }, transaction);

            const confirmUrl = `${WEBSITE_HOST}/api/v1/mysql/user_password_reset/${uuid}/reset_password`;
            const mail = new CreateResetMailer({ confirmUrl, username: user.user_username, to: user.user_email });
            await mail.send();
        });
    }

    /**
     * @function resetPassword
     * @description Reset a user's password.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.body
     * @param {string} options.body.password
     * @returns {Promise<void>}
     */
    async resetPassword(options = { uuid: null, body: null }) {
        Validator.resetPassword(options);
        
        const { uuid, body } = options;

        await db.sequelize.transaction(async (transaction) => {
            const user = await db.UserView.findOne({
                where: { user_uuid: userPasswordReset.user_uuid },
                transaction,
            });
            if (!user) throw new err.EntityNotFoundError('user');

            const userPasswordReset = await db.UserPasswordResetView.findOne({ 
                where: { user_password_reset_uuid: uuid }, 
                transaction 
            });
            if (!userPasswordReset) throw new err.EntityNotFoundError('user_password_reset');

            await userPasswordReset.deleteUserPasswordResetProc(transaction);
            await user.editUserProc({ password: await PwdService.hash(body.password) }, transaction);

            const mail = new ConfirmResetMailer({ username: user.user_username, to: user.user_email });
            await mail.send();
        });
    }
}

const service = new UserPasswordResetService();

export default service;
