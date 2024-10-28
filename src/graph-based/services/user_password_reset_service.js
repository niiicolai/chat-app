import ControllerError from '../../shared/errors/controller_error.js';
import dto from '../dto/user_password_reset_dto.js';
import bcrypt from 'bcrypt';
import { v4 as v4uuid } from 'uuid';
import UserCreatePasswordResetMailer from '../../shared/mailers/user_create_password_reset_mailer.js';
import UserConfirmPasswordResetMailer from '../../shared/mailers/user_confirm_password_reset_mailer.js';
import neodeInstance from '../neode/index.js';

const saltRounds = 10;

const WEBSITE_HOST = process.env.WEBSITE_HOST;
if (!WEBSITE_HOST) console.error('WEBSITE_HOST is not defined in the .env file.\n  - Email verification is currently not configured correct.\n  - Add WEBSITE_HOST=http://localhost:3000 to the .env file.');

class UserEmailVerificationService {

    async create(options = { body: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.body.email) throw new ControllerError(400, 'No email provided');

        const { body } = options;
        const { email } = body;

        const result = await neodeInstance.cypher('MATCH (u:User) WHERE u.email = $email RETURN u', { email });
        const records = result.records;
        if (records.length === 0) return;

        const uuid = v4uuid();
        const expires_at = new Date();
        expires_at.setHours(expires_at.getHours() + 1);

        const passwordReset = await neodeInstance.create('UserPasswordReset', {
            uuid,
            expires_at,
            created_at: new Date(),
            updated_at: new Date(),
        });

        const userProps = records[0].get('u').properties;
        const userInstance = await neodeInstance.model('User').find(userProps.uuid);

        await passwordReset.relateTo(userInstance, 'user');
        
        const to = userProps.email;
        const username = userProps.username;
        const confirmUrl = `${WEBSITE_HOST}/api/v1/neo4j/user_password_reset/${uuid}/reset_password`;
        const mail = new UserCreatePasswordResetMailer({ confirmUrl, username, to });
        await mail.send();
    }

    async resetPassword(options = { uuid: null, body: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.body.password) throw new ControllerError(400, 'No password provided');

        const { uuid, body } = options;

        const existingInstance = await neodeInstance.model('UserPasswordReset').find(uuid);
        if (!existingInstance) {
            throw new ControllerError(404, 'User password reset not found. Ensure the link is correct.');
        }

        const passwordReset = existingInstance.properties();
        if (passwordReset.expires_at < new Date()) {
            throw new ControllerError(400, 'User password reset has expired. Please request a new link.');
        }

        const user = existingInstance.get('user').endNode().properties();
        const userInstance = await neodeInstance.model('User').find(user.uuid);
        
        await existingInstance.delete();
        await userInstance.update({ password: bcrypt.hashSync(body.password, saltRounds) });
        
        const username = user.username;
        const to = user.email;
        const mail = new UserConfirmPasswordResetMailer({ username, to });
        await mail.send();
    }
}

const service = new UserEmailVerificationService();

export default service;
