import UserStatusState from '../models/user_status_state.js';

const data = [
    { name: 'Online' },
    { name: 'Away' },
    { name: 'Do Not Disturb' },
    { name: 'Offline' },
];

export default class UserStatusStateSeeder {
    async up() {
        await UserStatusState.insertMany(data);
    }

    async down() {
        await UserStatusState.deleteMany({ name: { $in: data.map((d) => d.name) } });
    }
}
