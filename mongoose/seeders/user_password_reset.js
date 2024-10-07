import UserPasswordReset from '../models/user_password_reset.js';
import data from './data.js';

export default class UserPasswordResetSeeder {
    async up() {
        await UserPasswordReset.insertMany(data.user_password_resets);
    }

    async down() {
        await UserPasswordReset.deleteMany({ uuid: { $in: data.user_password_resets.map((d) => d.uuid) } });
    }
}
