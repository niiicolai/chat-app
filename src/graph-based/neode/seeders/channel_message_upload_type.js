import data from '../../../seed_data.js';

export default class ChannelMessageUploadTypeSeeder {
    order() {
        return 0;
    }
    
    async up(neodeInstance) {
        await Promise.all(data.channel_message_upload_types.map(async (state) => {
            return neodeInstance.model('ChannelMessageUploadType').create({
                name: state.name,
            });
        }));
    }

    async down(neodeInstance) {
        await neodeInstance.cypher('MATCH (n:ChannelMessageUploadType) DETACH DELETE n');
    }
}
