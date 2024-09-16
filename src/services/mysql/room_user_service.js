import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';

const service = new MysqlBaseFindService(
    db.RoomUserView,
    (m) => {
        const res = {
            uuid: m.room_user_uuid,
            room_user_role_name: m.room_user_role_name,
            room_uuid: m.room_uuid,
        };

        if (m.user_uuid) {
            res.user = {};
            res.user.uuid = m.user_uuid;
            res.user.username = m.user_username;
            res.user.avatar_src = m.user_avatar_src;
        }

        return res;
    }
);

export default service;
