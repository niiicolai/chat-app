import UserStatusState from '../../../mongoose/models/user_status_state.js';
import MongodbBaseFindService from './_mongodb_base_find_service.js';
import dto from '../../dto/type_dto.js';

const service = new MongodbBaseFindService(UserStatusState, dto, 'name');

export default service;
