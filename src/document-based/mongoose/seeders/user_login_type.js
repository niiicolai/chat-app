import UserLoginType from '../models/user_login_type.js';
import data from '../../../seed_data.js';

export default class UserLoginTypeSeeder {
    async up() {
        await UserLoginType.insertMany(data.user_login_types.map((type) => {
            return { _id: type.name }
        }));
    }

    async down() {
        if (await UserLoginType.exists()) {
            await UserLoginType.collection.drop();
        }
    }
}
