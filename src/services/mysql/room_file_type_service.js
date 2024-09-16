import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';

const service = new MysqlBaseFindService(
    db.RoomFileTypeView,
    (m) => {
        return {
            name: m.room_file_type_name,
            created_at: m.room_file_type_created_at,
            updated_at: m.room_file_type_updated_at,
        };
    }
);

export default service;
