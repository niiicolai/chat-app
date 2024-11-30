import data from '../../../seed_data.js';

export default class ChannelMessageUploadTypeSeeder {
    order() {
        return 0;
    }
    
    async up(neodeInstance) {
        for (let state of data.channel_message_upload_types) {
            neodeInstance.model('ChannelMessageUploadType').create({
                name: state.name,
                created_at: new Date(),
                updated_at: new Date()
            });
        }
    }

    async down(neodeInstance) {
        for (let state of data.channel_message_upload_types) {
            const savedState = await neodeInstance.model('ChannelMessageUploadType').find(state.name);
            if (!savedState) {
                continue;
            }

            await savedState.delete();
        }        
    }
}
