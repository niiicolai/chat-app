import ChannelWebhook from '../models/channel_webhook.js';
import data from './data.js';

export default class ChannelWebhookSeeder {
    async up() {
        await ChannelWebhook.insertMany(data.channel_webhooks);
    }

    async down() {
        await ChannelWebhook.deleteMany({ uuid: { $in: data.channel_webhooks.map((d) => d.uuid) } });
    }
}
