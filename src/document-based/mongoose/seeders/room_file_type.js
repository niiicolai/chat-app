import RoomFileType from '../models/room_file_type.js';
import data from './data.js';

export default class RoomFileTypeSeeder {
    async up() {
        await RoomFileType.insertMany(data.room_file_types);
    }

    async down() {
        if (await RoomFileType.exists()) {
            await RoomFileType.collection.drop();
        }
    }
}
