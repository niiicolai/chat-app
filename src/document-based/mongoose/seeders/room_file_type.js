import RoomFileType from '../models/room_file_type.js';
import data from './data.js';

export default class RoomFileTypeSeeder {
    async up() {
        await RoomFileType.insertMany(data.room_file_types);
    }

    async down() {
        await RoomFileType.deleteMany({ name: { $in: data.room_file_types.map((d) => d.name) } });
    }
}
