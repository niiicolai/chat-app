import data from '../../../seed_data.js';

export default class ChannelTypeSeeder {
    order() {
        return 0;
    }
    
    async up(neodeInstance) {
        for (let state of data.channel_types) {
            neodeInstance.model('ChannelType').create({
                name: state.name,
                created_at: new Date(),
                updated_at: new Date()
            });
        }
    }

    async down(neodeInstance) {
        for (let state of data.channel_types) {
            const savedState = await neodeInstance.model('ChannelType').find(state.name);
            if (!savedState) {
                continue;
            }

            await savedState.delete();
        }        
    }
}
