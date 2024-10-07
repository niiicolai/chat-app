import RoomUserRole from '../../../mongoose/models/room_user_role.js';
import MongodbBaseFindService from './_mongodb_base_find_service.js';
import dto from '../../dto/type_dto.js';

const service = new MongodbBaseFindService(RoomUserRole, dto, 'name');

export default service;
