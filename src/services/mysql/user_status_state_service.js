import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';
import dto from '../../dto/type_dto.js';

const service = new MysqlBaseFindService(
    db.UserStatusStateView,
    (m) => dto(m, 'user_status_state_')
);

export default service;
