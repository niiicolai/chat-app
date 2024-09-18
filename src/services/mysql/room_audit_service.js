import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';
import ControllerError from '../../errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';

const dto = (m) => {
    return {
        uuid: m.room_audit_uuid,
        body: m.room_audit_body,
        room_audit_type_name: m.room_audit_type_name,
        room_uuid: m.room_uuid,
        created_at: m.room_audit_created_at,
        updated_at: m.room_audit_updated_at,
    };
};

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.RoomAuditView, dto);
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
        const { room_uuid } = options;
        if (!room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }
        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }
        return await super.findAll({ ...options, where: { room_uuid } });
    }
}

const service = new Service();

export default service;
