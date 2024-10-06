import User from '../models/user.js';
import data from './data.js';

export default class UserSeeder {
    async up() {
        await User.insertMany(data.users);
    }

    async down() {
        await User.deleteMany({ uuid: { $in: data.users.map((d) => d.uuid) } });
    }
}
