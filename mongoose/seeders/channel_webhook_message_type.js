import ChannelWebhookMessageType from '../models/channel_webhook_message_type.js';

const data = [
    { name: 'Custom' },
    { name: 'GitHub' },
];

export default class ChannelWebhookMessageTypeSeeder {
    async up() {
        await ChannelWebhookMessageType.insertMany(data);
    }

    async down() {
        await ChannelWebhookMessageType.deleteMany({ name: { $in: data.map((d) => d.name) } });
    }
}
