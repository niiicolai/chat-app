import ChannelWebhookMessageType from '../models/channel_webhook_message_type.js';
import data from '../../../seed_data.js';

export default class ChannelWebhookMessageTypeSeeder {
    async up() {
        await ChannelWebhookMessageType.insertMany(data.channel_webhook_message_types.map((type) => {
            return { _id: type.name }
        }));
    }

    async down() {
        if (await ChannelWebhookMessageType.exists()) {
            await ChannelWebhookMessageType.collection.drop();
        }
    }
}
