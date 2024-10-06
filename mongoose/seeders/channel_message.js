import ChannelMessage from '../models/channel_message.js';
import data from './data.js';

export default class ChannelMessageSeeder {
    async up() {
        await ChannelMessage.insertMany(data.channel_messages);
    }

    async down() {
        await ChannelMessage.deleteMany({ uuid: { $in: data.channel_messages.map((d) => d.uuid) } });
    }
}
