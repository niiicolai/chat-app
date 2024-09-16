import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';

const service = new MysqlBaseFindService(
    db.ChannelWebhookMessageView,
    (m) => {
        return {
            uuid: m.channel_webhook_message_uuid,
            body: m.channel_webhook_message_body,
            channel_webhook_message_type_name: m.channel_webhook_message_type_name,
            channel_webhook_uuid: m.channel_webhook_uuid,
            channel_message_uuid: m.channel_message_uuid,
            channel_uuid: m.channel_uuid,
        };
    }
);

export default service;

