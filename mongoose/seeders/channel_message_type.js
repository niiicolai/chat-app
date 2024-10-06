import ChannelMessageType from '../models/channel_message_type.js';

const data = [
    { name: 'User' },
    { name: 'System' },
    { name: 'Webhook' },
];

export default class ChannelMessageTypeSeeder {
    async up() {
        await ChannelMessageType.insertMany(data);
    }

    async down() {
        await ChannelMessageType.deleteMany({ name: { $in: data.map((d) => d.name) } });
    }
}
