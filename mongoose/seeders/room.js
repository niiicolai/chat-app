import Room from '../models/room.js';
import data from './data.js';

export default class RoomSeeder {
    async up() {
        await Room.insertMany(data.rooms);
    }

    async down() {
        await Room.deleteMany({ uuid: { $in: data.rooms.map((d) => d.uuid) } });
    }
}
