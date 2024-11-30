import data from '../../../seed_data.js';

export default class ChannelWebhookMessageTypeSeeder {
    order() {
        return 0;
    }
    
    async up(neodeInstance) {
        for (let state of data.channel_webhook_message_types) {
            neodeInstance.model('ChannelWebhookMessageType').create({
                name: state.name,
                created_at: new Date(),
                updated_at: new Date()
            });
        }
    }

    async down(neodeInstance) {
        for (let state of data.channel_webhook_message_types) {
            const savedState = await neodeInstance.model('ChannelWebhookMessageType').find(state.name);
            if (!savedState) {
                continue;
            }

            await savedState.delete();
        }        
    }
}
