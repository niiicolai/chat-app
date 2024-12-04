import data from '../../../seed_data.js';

export default class ChannelTypeSeeder {
    order() {
        return 0;
    }
    
    async up(neodeInstance) {
        await Promise.all(data.channel_types.map(async (state) => {
            return neodeInstance.model('ChannelType').create({
                name: state.name,
            });
        }));
    }

    async down(neodeInstance) {
        await neodeInstance.cypher('MATCH (n:ChannelType) DETACH DELETE n');
    }
}
