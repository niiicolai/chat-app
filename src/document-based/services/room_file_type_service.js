import RoomFileType from '../../../mongoose/models/room_file_type.js';
import MongodbBaseFindService from './_mongodb_base_find_service.js';
import dto from '../dto/type_dto.js';

const service = new MongodbBaseFindService(RoomFileType, dto, 'name');

export default service;
