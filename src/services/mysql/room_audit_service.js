import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';
import ControllerError from '../../errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../../dto/room_audit_dto.js';

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.RoomAuditView, (m) => dto(m, 'room_audit_'));
    }

    async findOne(options = { user: null }) {
        const { user } = options;
        const r = await super.findOne({ ...options });

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid: r.room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return r;
    }

    async findAll(options = { room_uuid: null, user: null }) {
        const { room_uuid } = options;

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }
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
