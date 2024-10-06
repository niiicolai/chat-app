import RoomFileType from '../models/room_file_type.js';

const data = [
    { name: 'ChannelWebhookAvatar' },
    { name: 'ChannelMessageUpload' },
    { name: 'ChannelAvatar' },
    { name: 'RoomAvatar' },
];

export default class RoomFileTypeSeeder {
    async up() {
        await RoomFileType.insertMany(data);
    }

    async down() {
        await RoomFileType.deleteMany({ name: { $in: data.map((d) => d.name) } });
    }
}
