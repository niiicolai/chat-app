import RoomAvatar from '../models/room_avatar.js';
import data from './data.js';

export default class RoomAvatarSeeder {
    async up() {
        await RoomAvatar.insertMany(data.room_avatars);
    }

    async down() {
        await RoomAvatar.deleteMany({ uuid: { $in: data.room_avatars.map((d) => d.uuid) } });
    }
}
