import ChannelMessageType from '../mongoose/models/channel_message_type.js';
import MongodbBaseFindService from './_mongodb_base_find_service.js';
import dto from '../dto/type_dto.js';

const service = new MongodbBaseFindService(ChannelMessageType, dto, 'name');

export default service;
