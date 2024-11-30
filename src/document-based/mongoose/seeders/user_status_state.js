import UserStatusState from '../models/user_status_state.js';
import data from '../../../seed_data.js';

export default class UserStatusStateSeeder {
    async up() {
        await UserStatusState.insertMany(data.user_status_states);
    }

    async down() {
        if (await UserStatusState.exists()) {
            await UserStatusState.collection.drop();
        }
    }
}
