import RoomFile from '../models/room_file.js';
import data from './data.js';

export default class RoomFileSeeder {
    async up() {
        await RoomFile.insertMany(data.room_files);
    }

    async down() {
        await RoomFile.deleteMany({ uuid: { $in: data.room_files.map((d) => d.uuid) } });
    }
}
