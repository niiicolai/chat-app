import UserStatusState from '../models/user_status_state.js';
import data from './data.js';

export default class UserStatusStateSeeder {
    async up() {
        await UserStatusState.insertMany(data.user_status_states);
    }

    async down() {
        await UserStatusState.collection.drop();
    }
}
