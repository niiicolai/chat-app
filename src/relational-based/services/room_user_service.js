import RoomUserServiceValidator from '../../shared/validators/room_user_service_validator.js';
import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../sequelize/models/index.cjs';
import ControllerError from '../../shared/errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/room_user_dto.js';

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.RoomUserView, dto);
    }

    async findOne(options = { uuid: null, user: null }) {
        RoomUserServiceValidator.findOne(options);
        const { user, uuid } = options;
        const r = await super.findOne({ uuid });
        
        if (!(await RoomPermissionService.isInRoom({ room_uuid: r.room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return r;
    }

    async findAuthenticatedUser(options = { room_uuid: null, user: null }) {
        RoomUserServiceValidator.findAuthenticatedUser(options);
        const { room_uuid, user } = options;
        const { sub: user_uuid } = user;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const m = await this.model.findOne({ where: { room_uuid, user_uuid } });

        if (!m) {
            throw new ControllerError(404, 'Room user not found');
        }

        return this.dto(m);
    }

    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        RoomUserServiceValidator.findAll(options);
        const { room_uuid, user, page, limit } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return await super.findAll({ page, limit, where: { room_uuid } });
    }

    async update(options = { uuid: null, body: null, user: null }) {
        RoomUserServiceValidator.update(options);

        const { uuid, body, user } = options;
        const { room_user_role_name } = body;

        const existing = await db.RoomUserView.findOne({ where: { room_user_uuid: uuid } });
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

    async destroy(options = { uuid: null, user: null }) {
        RoomUserServiceValidator.destroy(options);

        const { uuid, user } = options;
        const existing = await db.RoomUserView.findOne({ where: { room_user_uuid: uuid } });
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
