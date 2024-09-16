import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';

const service = new MysqlBaseFindService(
    db.RoomUserRoleView,
    (m) => {
        return {
            name: m.room_user_role_name,
            created_at: m.room_user_role_created_at,
            updated_at: m.room_user_role_updated_at,
        };
    }
);

export default service;
