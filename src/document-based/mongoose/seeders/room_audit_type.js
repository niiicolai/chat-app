import RoomAuditType from '../models/room_audit_type.js';
import data from './data.js';

export default class RoomAuditTypeSeeder {
    async up() {
        await RoomAuditType.insertMany(data.room_audit_types);
    }

    async down() {
        await RoomAuditType.collection.drop();
    }
}
