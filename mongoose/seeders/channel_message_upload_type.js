import ChannelMessageUploadType from '../models/channel_message_upload_type.js';

const data = [
    { name: 'Image' },
    { name: 'Video' },
    { name: 'Document' },
];

export default class ChannelMessageUploadTypeSeeder {
    async up() {
        await ChannelMessageUploadType.insertMany(data);
    }

    async down() {
        await ChannelMessageUploadType.deleteMany({ name: { $in: data.map((d) => d.name) } });
    }
}
