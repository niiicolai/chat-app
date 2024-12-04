import data from '../../../seed_data.js';

export default class ChannelMessageTypeSeeder {
    order() {
        return 0;
    }
    
    async up(neodeInstance) {
        await Promise.all(data.channel_message_types.map(async (state) => {
            return neodeInstance.model('ChannelMessageType').create({
                name: state.name,
            });
        }));
    }

    async down(neodeInstance) {
        await neodeInstance.cypher('MATCH (n:ChannelMessageType) DETACH DELETE n');
    }
}
