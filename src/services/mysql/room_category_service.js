import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';

const service = new MysqlBaseFindService(
    db.RoomCategoryView,
    (m) => {
        return {
            name: m.room_category_name,
            created_at: m.room_category_created_at,
            updated_at: m.room_category_updated_at,
        };
    }
);

export default service;
