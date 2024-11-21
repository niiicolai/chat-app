import RoomUserRole from '../models/room_user_role.js';
import data from './data.js';

export default class RoomUserRoleSeeder {
    async up() {
        await RoomUserRole.insertMany(data.room_user_roles);
    }

    async down() {
        if (await RoomUserRole.exists()) {
            await RoomUserRole.collection.drop();
        }
    }
}
