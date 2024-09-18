import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';

const service = new MysqlBaseFindService(
    db.ChannelWebhookMessageTypeView,
    (m) => {
        return {
            name: m.channel_webhook_message_type_name,
            created_at: m.channel_webhook_message_type_created_at,
            updated_at: m.channel_webhook_message_type_updated_at,
        };
    }
);

export default service;
