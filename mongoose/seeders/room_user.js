import RoomUser from '../models/room_user.js';
import data from './data.js';

export default class RoomUserSeeder {
    async up() {
        await RoomUser.insertMany(data.room_users);
    }

    async down() {
        await RoomUser.deleteMany({ uuid: { $in: data.room_users.map((d) => d.uuid) } });
    }
}
