import UserEmailVerification from '../models/user_email_verification.js';
import data from './data.js';

export default class UserEmailVerificationSeeder {
    async up() {
        await UserEmailVerification.insertMany(data.user_email_verifications);
    }

    async down() {
        await UserEmailVerification.deleteMany({ uuid: { $in: data.user_email_verifications.map((d) => d.uuid) } });
    }
}
