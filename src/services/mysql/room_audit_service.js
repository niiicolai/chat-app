import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';

const service = new MysqlBaseFindService(
    db.RoomAuditView,
    (m) => {
        return {
            uuid: m.room_audit_uuid,
            body: m.room_audit_body,
            room_audit_type_name: m.room_audit_type_name,
            room_uuid: m.room_uuid,
            created_at: m.room_audit_created_at,
            updated_at: m.room_audit_updated_at,
        };
    }
);

export default service;
