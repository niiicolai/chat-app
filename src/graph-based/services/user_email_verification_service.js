import ControllerError from '../../shared/errors/controller_error.js';
import dto from '../dto/user_email_verification_dto.js';
import UserEmailVerificationMailer from '../../shared/mailers/user_email_verification_mailer.js';
import neodeInstance from '../neode/index.js';

const WEBSITE_HOST = process.env.WEBSITE_HOST;
if (!WEBSITE_HOST) console.error('WEBSITE_HOST is not defined in the .env file.\n  - Email verification is currently not configured correct.\n  - Add WEBSITE_HOST=http://localhost:3000 to the .env file.');


class UserEmailVerificationService {
    async resend(options = { user_uuid: null }) {
        const { user_uuid } = options;

        if (!user_uuid) {
            throw new ControllerError(500, 'No user_uuid provided');
        }

        const userInstance = await neodeInstance.model('User').find(user_uuid);        
        if (!userInstance) {
            throw new ControllerError(404, 'User not found');
        }

        const emailVerification = userInstance.get('user_email_verification')?.endNode()?.properties();
        if (!emailVerification) {
            throw new ControllerError(500, 'User email verification not found');
        }

        if (emailVerification.is_verified) {
            throw new ControllerError(400, 'User email already verified');
        }

        const user = userInstance.properties();
        const confirmUrl = `${WEBSITE_HOST}/api/v1/neo4j/user_email_verification/${emailVerification.uuid}/confirm`;
        const username = user.username;
        const to = user.email;
        
        const mail = new UserEmailVerificationMailer({ confirmUrl, username, to });
        await mail.send();
    }

    async confirm(options = { uuid: null }) {
        const { uuid } = options;

        if (!uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }

        const userEmailVerification = await neodeInstance.model('UserEmailVerification').find(uuid);
        if (!userEmailVerification) {
            throw new ControllerError(404, 'User email verification not found. Ensure the link is correct.');
        }

        if (userEmailVerification.is_verified) {
            throw new ControllerError(400, 'User email already verified');
        }

        await userEmailVerification.update({ is_verified: true });
    }
}


const service = new UserEmailVerificationService();

export default service;
