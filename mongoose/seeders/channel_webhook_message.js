import ChannelWebhookMessage from '../models/channel_webhook_message.js';
import data from './data.js';

export default class ChannelWebhookMessageSeeder {
    async up() {
        await ChannelWebhookMessage.insertMany(data.channel_webhook_messages);
    }

    async down() {
        await ChannelWebhookMessage.deleteMany({ uuid: { $in: data.channel_webhook_messages.map((d) => d.uuid) } });
    }
}
