import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';

const service = new MysqlBaseFindService(
    db.ChannelAuditView,
    (m) => {
        return {
            uuid: m.channel_audit_uuid,
            body: m.channel_audit_body,
            type: m.channel_audit_type_name,
            channel_uuid: m.channel_uuid,
            room_uuid: m.room_uuid,
            created_at: m.channel_audit_created_at,
            updated_at: m.channel_audit_updated_at,
        };
    }
);

export default service;

