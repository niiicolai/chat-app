import RoomFileType from '../models/room_file_type.js';
import data from '../../../seed_data.js';

export default class RoomFileTypeSeeder {
    async up() {
        await RoomFileType.insertMany(data.room_file_types.map((type) => {
            return { _id: type.name }
        }));
    }

    async down() {
        if (await RoomFileType.exists()) {
            await RoomFileType.collection.drop();
        }
    }
}
