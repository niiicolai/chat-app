import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';

const service = new MysqlBaseFindService(
    db.ChannelWebhookView,
    (m) => {
        const res = {
            uuid: m.channel_webhook_uuid,
            name: m.channel_webhook_name,
            description: m.channel_webhook_description,
            channel_uuid: m.channel_uuid,
            room_uuid: m.room_uuid,
            created_at: m.channel_webhook_created_at,
            updated_at: m.channel_webhook_updated_at,
        };
        if (m.room_file_uuid) {
            res.room_file = {};
            res.room_file.uuid = m.room_file_uuid;
            res.room_file.src = m.room_file_src;
            res.room_file.room_file_type_name = m.room_file_type_name;
            res.room_file.size_bytes = m.room_file_size;
            res.room_file.size_mb = parseFloat(m.room_file_size_mb);
        }
        return res;
    }
);

export default service;
