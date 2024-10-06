import RoomAudit from '../models/room_audit.js';
import data from './data.js';

export default class RoomAuditSeeder {
    async up() {
        await RoomAudit.insertMany(data.room_audits);
    }

    async down() {
        await RoomAudit.deleteMany({ uuid: { $in: data.room_audits.map((d) => d.uuid) } });
    }
}
