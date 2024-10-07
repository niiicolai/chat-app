import ChannelType from '../../../mongoose/models/channel_type.js';
import MongodbBaseFindService from './_mongodb_base_find_service.js';
import dto from '../../dto/type_dto.js';

const service = new MongodbBaseFindService(ChannelType, dto, 'name');

export default service;
