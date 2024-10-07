import UserStatus from '../models/user_status.js';
import data from './data.js';

export default class UserStatusSeeder {
    async up() {
        await UserStatus.insertMany(data.user_statuses);
    }

    async down() {
        await UserStatus.deleteMany({ uuid: { $in: data.user_statuses.map((d) => d.uuid) } });
    }
}
