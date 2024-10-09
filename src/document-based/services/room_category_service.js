import RoomCategory from '../mongoose/models/room_category.js';
import MongodbBaseFindService from './_mongodb_base_find_service.js';
import dto from '../dto/type_dto.js';

const service = new MongodbBaseFindService(RoomCategory, dto, 'name');

export default service;
