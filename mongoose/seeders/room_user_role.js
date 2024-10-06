import RoomUserRole from '../models/room_user_role.js';

const data = [
    { name: 'Admin' },
    { name: 'Moderator' },
    { name: 'Member' },
];

export default class RoomUserRoleSeeder {
    async up() {
        await RoomUserRole.insertMany(data);
    }

    async down() {
        await RoomUserRole.deleteMany({ name: { $in: data.map((d) => d.name) } });
    }
}
