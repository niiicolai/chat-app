import data from '../../../seed_data.js';

export default class RoomAuditTypeSeeder {
    order() {
        return 0;
    }
    
    async up(neodeInstance) {
        await Promise.all(data.room_audit_types.map(async (state) => {
            return neodeInstance.model('RoomAuditType').create({
                name: state.name,
            });
        }));
    }

    async down(neodeInstance) {
        await neodeInstance.cypher('MATCH (n:RoomAuditType) DETACH DELETE n');
    }
}
