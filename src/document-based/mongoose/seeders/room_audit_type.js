import RoomAuditType from '../models/room_audit_type.js';
import data from '../../../seed_data.js';

export default class RoomAuditTypeSeeder {
    async up() {
        await RoomAuditType.insertMany(data.room_audit_types.map((type) => {
            return { _id: type.name }
        }));
    }

    async down() {
        if (await RoomAuditType.exists()) {
            await RoomAuditType.collection.drop();
        }
    }
}
