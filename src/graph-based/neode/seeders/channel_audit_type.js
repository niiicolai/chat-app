import data from '../../../seed_data.js';

export default class ChannelAuditTypeSeeder {
    
    order() {
        return 0;
    }

    async up(neodeInstance) {
        await Promise.all(data.channel_audit_types.map(async (state) => {
            return neodeInstance.model('ChannelAuditType').create({
                name: state.name,
            });
        }));
    }

    async down(neodeInstance) {
        await neodeInstance.cypher('MATCH (n:ChannelAuditType) DETACH DELETE n');
    }
}
