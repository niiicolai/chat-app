import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';
import ControllerError from '../../errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';

const dto = (m) => {
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
};

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.RoomUserView, dto);
    }

    async findOne(options = { room_uuid: null, user: null }) {
        const { room_uuid, user } = options;
        if (!room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }
        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }
        return await super.findOne({ ...options });
    }

    async findAll(options = { room_uuid: null, user: null }) {
        const { room_uuid, user } = options;
        if (!room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }
        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }
        return await super.findAll({ ...options, where: { room_uuid } });
    }

    async update(options = { room_user_uuid: null, body: null, user: null }) {
        const { room_user_uuid, body, user } = options;
        const { room_user_role_name } = body;
        if (!room_user_uuid) {
            throw new ControllerError(400, 'No room_user_uuid provided');
        }
        if (!room_user_role_name) {
            throw new ControllerError(400, 'No room_user_role_name provided');
        }
        const existing = await db.RoomUserView.findOne({ where: { room_user_uuid } });
        if (!existing) {
            throw new ControllerError(404, 'Room user not found');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid: existing.room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        await db.sequelize.query('CALL edit_room_user_role_proc(:user_uuid, :room_uuid, :role_name, @result)', {
            replacements: {
                user_uuid: existing.user_uuid,
                room_uuid: existing.room_uuid,
                role_name: room_user_role_name,
            },
        });
    }

    async destroy(options = { room_user_uuid: null, user: null }) {
        const { room_user_uuid, user } = options;
        if (!room_user_uuid) {
            throw new ControllerError(400, 'No room_user_uuid provided');
        }
        const existing = await db.RoomUserView.findOne({ where: { room_user_uuid } });
        if (!existing) {
            throw new ControllerError(404, 'Room user not found');
        }

        const room_uuid = existing.room_uuid;
        const user_uuid = existing.user_uuid;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        await db.sequelize.query('CALL leave_room_proc(:user_uuid, :room_uuid, @result)', {
            replacements: {
                user_uuid,
                room_uuid,
            },
        });
    }
}

const service = new Service();

export default service;
