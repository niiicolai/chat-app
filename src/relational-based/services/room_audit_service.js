import RoomAuditServiceValidator from '../../shared/validators/room_audit_service_validator.js';
import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../sequelize/models/index.cjs';
import ControllerError from '../../shared/errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/room_audit_dto.js';

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.RoomAuditView, dto);
    }

    async findOne(options = { user: null }) {
        RoomAuditServiceValidator.findOne(options);

        const { user } = options;
        const r = await super.findOne({ ...options });

        if (!(await RoomPermissionService.isInRoom({ room_uuid: r.room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return r;
    }

    async findAll(options = { room_uuid: null, user: null }) {
        options = RoomAuditServiceValidator.findAll(options);
        const { room_uuid, user } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }
        
        return await super.findAll({ ...options, where: { room_uuid } });
    }
}

const service = new Service();

export default service;
