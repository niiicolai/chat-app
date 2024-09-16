import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';

const service = new MysqlBaseFindService(
    db.RoomFileView,
    (m) => {
        return {
            uuid: m.room_file_uuid,
            src: m.room_file_src,
            size_bytes: m.room_file_size,
            size_mb: parseFloat(m.room_file_size_mb),
            room_file_type_name: m.room_file_type_name,
            room_uuid: m.room_uuid,
        };
    }
);

service.destroy = async (options={ room_file_uuid: null, user: null }) => {
    const { room_file_uuid, user } = options;
    const { sub: user_uuid } = user;

    if (!room_file_uuid) {
        throw new ControllerError(400, 'No room_file_uuid provided');
    }

    const existing = await service.model.findOne({ where: { room_file_uuid } });
    if (!existing) {
        throw new ControllerError(404, 'Room File not found');
    }

    await db.sequelize.query('CALL delete_room_file_proc(:room_file_uuid, @result)', {
        replacements: {
            room_file_uuid,
        },
    });
};

export default service;
