import User from '../models/user.js';
import data from '../../../seed_data.js';

export default class UserSeeder {
    async up() {
        await User.insertMany(data.users.map((user) => {
            const doc = {
                _id: user.uuid,
                username: user.username,
                email: user.email,
                user_email_verification: { 
                    _id: user.user_email_verification.uuid, 
                    ...user.user_email_verification 
                },
                user_status: { 
                    _id: user.user_status.uuid, 
                    ...user.user_status 
                },
                user_logins: user.user_logins.map((user_login) => {
                    return { _id: user_login.uuid, ...user_login }
                }),
                user_password_resets: user.user_password_resets.map((user_password_reset) => {
                    return { _id: user_password_reset.uuid, ...user_password_reset }
                }),
            }

            // Remove the UUIDs from the document
            // because they are stored as _id
            delete doc.user_email_verification.uuid;
            delete doc.user_status.uuid;
            delete doc.user_logins.forEach((user_login) => delete user_login.uuid);
            delete doc.user_password_resets.forEach((user_password_reset) => delete user_password_reset.uuid);

            return doc;
        }));
    }

    async down() {
        if (await User.exists()) {
            await User.collection.drop();
        }
    }
}
