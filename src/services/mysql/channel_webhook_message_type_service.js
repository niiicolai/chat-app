import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';
import dto from '../../dto/type_dto.js';

const service = new MysqlBaseFindService(
    db.ChannelWebhookMessageTypeView,
    (m) => dto(m, 'channel_webhook_message_type_')
);

export default service;
