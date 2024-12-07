import RoomUserRole from '../models/room_user_role.js';
import data from '../../../seed_data.js';

export default class RoomUserRoleSeeder {
    async up() {
        await RoomUserRole.insertMany(data.room_user_roles.map((type) => {
            return { _id: type.name }
        }));
    }

    async down() {
        if (await RoomUserRole.exists()) {
            await RoomUserRole.collection.drop();
        }
    }
}
