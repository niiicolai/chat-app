import MongodbBaseFindService from './_mongodb_base_find_service.js';
import ControllerError from '../../shared/errors/controller_error.js';
import dto from '../dto/user_email_verification_dto.js';
import UserEmailVerification from '../mongoose/models/user_email_verification.js';
import UserEmailVerificationMailer from '../../shared/mailers/user_email_verification_mailer.js';
import User from '../mongoose/models/user.js';

const WEBSITE_HOST = process.env.WEBSITE_HOST;
if (!WEBSITE_HOST) console.error('WEBSITE_HOST is not defined in the .env file.\n  - Email verification is currently not configured correct.\n  - Add WEBSITE_HOST=http://localhost:3000 to the .env file.');


class UserEmailVerificationService extends MongodbBaseFindService {
    constructor() {
        super(UserEmailVerification, dto, 'uuid');
    }

    async resend(options = { user_uuid: null }) {
        const { user_uuid } = options;

        if (!user_uuid) {
            throw new ControllerError(500, 'No user_uuid provided');
        }

        const user = await User.findOne({ uuid: user_uuid }).populate('user_email_verification');
        
        if (!user) {
            throw new ControllerError(404, 'User not found');
        }

        if (!user.user_email_verification) {
            throw new ControllerError(500, 'User email verification not found');
        }

        if (user.user_email_verification.is_verified) {
            throw new ControllerError(400, 'User email already verified');
        }

        const confirmUrl = `${WEBSITE_HOST}/api/v1/mongodb/user_email_verification/${user.user_email_verification.uuid}/confirm`;
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

        const userEmailVerification = await UserEmailVerification.findOne({ uuid });
        if (!userEmailVerification) {
            throw new ControllerError(404, 'User email verification not found. Ensure the link is correct.');
        }

        if (userEmailVerification.is_verified) {
            throw new ControllerError(400, 'User email already verified');
        }

        userEmailVerification.is_verified = true;
        await userEmailVerification.save();
    }
}


const service = new UserEmailVerificationService();

export default service;
