import ChannelMessageUpload from '../models/channel_message_upload.js';
import data from './data.js';

export default class ChannelMessageUploadSeeder {
    async up() {
        await ChannelMessageUpload.insertMany(data.channel_message_uploads);
    }

    async down() {
        await ChannelMessageUpload.deleteMany({ name: { $in: data.channel_message_uploads.map((d) => d.name) } });
    }
}
