import data from '../../../seed_data.js';

export default class ChannelWebhookMessageTypeSeeder {
    order() {
        return 0;
    }
    
    async up(neodeInstance) {
        await Promise.all(data.channel_webhook_message_types.map(async (state) => {
            return neodeInstance.model('ChannelWebhookMessageType').create({
                name: state.name,
            });
        }));
    }

    async down(neodeInstance) {
        await neodeInstance.cypher('MATCH (n:ChannelWebhookMessageType) DETACH DELETE n');
    }
}
