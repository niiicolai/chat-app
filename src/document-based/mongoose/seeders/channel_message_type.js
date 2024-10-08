import ChannelMessageType from '../models/channel_message_type.js';
import data from './data.js';

export default class ChannelMessageTypeSeeder {
    async up() {
        await ChannelMessageType.insertMany(data.channel_message_types);
    }

    async down() {
        await ChannelMessageType.deleteMany({ name: { $in: data.channel_message_types.map((d) => d.name) } });
    }
}
