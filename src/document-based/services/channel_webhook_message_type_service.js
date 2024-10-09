import ChannelWebhookMessageType from '../mongoose/models/channel_webhook_message_type.js';
import MongodbBaseFindService from './_mongodb_base_find_service.js';
import dto from '../dto/type_dto.js';

const service = new MongodbBaseFindService(ChannelWebhookMessageType, dto, 'name');

export default service;
