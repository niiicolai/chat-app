import MongodbBaseFindService from './_mongodb_base_find_service.js';
import ControllerError from '../../errors/controller_error.js';
import MailService from '../mail_service.js';
import dto from '../../dto/user_email_verification_dto.js';
import UserEmailVerification from '../../../mongoose/models/user_email_verification.js';
import User from '../../../mongoose/models/user.js';

const WEBSITE_HOST = process.env.WEBSITE_HOST;
if (!WEBSITE_HOST) {
    throw new Error('ERROR: WEBSITE_HOST not set in .env');
}

const getSubject = () => 'Demo Chat App: Please verify your email address';
const getContent = (verification_uuid, username) => `
Hi ${username},

Please verify your email address by clicking the link below:
${WEBSITE_HOST}/api/v1/mongodb/user_email_verification/${verification_uuid}/confirm

If you did not sign up for an account, please ignore this email.

Thanks,
The Team
`;

class UserEmailVerificationService extends MongodbBaseFindService {
    constructor() {
        super(UserEmailVerification, (m) => dto(m, 'mongodb'), 'uuid');
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

        const verification_uuid = user.user_email_verification.uuid;
        const username = user.username;
        const subject = getSubject();
        const content = getContent(verification_uuid, username);

        await MailService.sendMail(content, subject, user.email);
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
