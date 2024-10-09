import RoomAuditType from '../mongoose/models/room_audit_type.js';
import MongodbBaseFindService from './_mongodb_base_find_service.js';
import dto from '../dto/type_dto.js';

const service = new MongodbBaseFindService(RoomAuditType, dto, 'name');

export default service;
