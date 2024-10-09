import ChannelMessageUploadType from '../mongoose/models/channel_message_upload_type.js';
import MongodbBaseFindService from './_mongodb_base_find_service.js';
import dto from '../dto/type_dto.js';

const service = new MongodbBaseFindService(ChannelMessageUploadType, dto, 'name');

export default service;
