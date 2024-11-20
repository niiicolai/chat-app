import ChannelMessageUploadType from '../models/channel_message_upload_type.js';
import data from './data.js';

export default class ChannelMessageUploadTypeSeeder {
    async up() {
        await ChannelMessageUploadType.insertMany(data.channel_message_upload_types);
    }

    async down() {
        await ChannelMessageUploadType.collection.drop();
    }
}
