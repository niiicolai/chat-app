import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';

const service = new MysqlBaseFindService(
    db.RoomAvatarView,
    (m) => {
        const res = {
            uuid: m.room_avatar_uuid,
            room_uuid: m.room_uuid,
        };
        if (m.room_file_uuid) {
            res.room_file = {};
            res.room_file.uuid = m.room_avatar_uuid;
            res.room_file.src = m.room_avatar_src;
            res.room_file.room_file_type_name = m.room_avatar_type_name;
            res.room_file.size_bytes = m.room_avatar_size;
            res.room_file.size_mb = parseFloat(m.room_avatar_size_mb);
        }

        return res;
    }
);

export default service;
