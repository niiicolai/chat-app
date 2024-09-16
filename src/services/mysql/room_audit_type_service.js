import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';

const service = new MysqlBaseFindService(
    db.RoomAuditTypeView,
    (m) => {
        return {
            name: m.room_audit_type_name,
            created_at: m.room_audit_type_created_at,
            updated_at: m.room_audit_type_updated_at,
        };
    }
);

export default service;
