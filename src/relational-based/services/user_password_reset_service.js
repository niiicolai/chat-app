import UserPasswordResetServiceValidator from '../../shared/validators/user_password_reset_service_validator.js';
import UserCreatePasswordResetMailer from '../../shared/mailers/user_create_password_reset_mailer.js';
import UserConfirmPasswordResetMailer from '../../shared/mailers/user_confirm_password_reset_mailer.js';
import EntityNotFoundError from '../../shared/errors/entity_not_found_error.js';
import PwdService from '../../shared/services/pwd_service.js';
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
        UserPasswordResetServiceValidator.create(options);

        const { email } = options.body;

        await db.sequelize.transaction(async (transaction) => {
            const user = await db.UserView.findOne({ where: { user_email: email }, transaction });
            if (!user) return;

            const replacements = {
                uuid: v4uuid(),
                user_uuid: user.user_uuid,
                expires_at: new Date(),
            };

            replacements.expires_at.setHours(replacements.expires_at.getHours() + 1);

            await db.sequelize.query('CALL create_user_password_reset_proc(:uuid, :user_uuid, :expires_at, @result)', {
                replacements,
                transaction,
            });

            const confirmUrl = `${WEBSITE_HOST}/api/v1/mysql/user_password_reset/${replacements.uuid}/reset_password`;
            const mail = new UserCreatePasswordResetMailer({ confirmUrl, username: user.user_username, to: user.user_email });
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
        UserPasswordResetServiceValidator.resetPassword(options);
        
        const { uuid, body } = options;

        await db.sequelize.transaction(async (transaction) => {
            const user = await db.UserView.findOne({
                where: { user_uuid: userPasswordReset.user_uuid },
                transaction,
            });
            if (!user) throw new EntityNotFoundError('user');

            const userPasswordReset = await db.UserPasswordResetView.findOne({ 
                where: { user_password_reset_uuid: uuid }, 
                transaction 
            });
            if (!userPasswordReset) throw new EntityNotFoundError('user_password_reset');

            await db.sequelize.query('CALL delete_user_password_reset_proc(:uuid, @result)', {
                replacements: { uuid },
                transaction,
            });

            const replacements = {
                uuid: user.user_uuid,
                username: user.user_username,
                email: user.user_email,
                password: await PwdService.hash(body.password),
                user_avatar_src: user.user_avatar_src || null,
            };

            await db.sequelize.query('CALL edit_user_proc(:uuid, :username, :email, :password, :user_avatar_src, @result)', {
                replacements,
                transaction,
            });

            const mail = new UserConfirmPasswordResetMailer({ username: user.user_username, to: user.user_email });
            await mail.send();
        });
    }
}

const service = new UserPasswordResetService();

export default service;
