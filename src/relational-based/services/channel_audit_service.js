import ChannelAuditServiceValidator from '../../shared/validators/channel_audit_service_validator.js';
import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../sequelize/models/index.cjs';
import ControllerError from '../../shared/errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/channel_audit_dto.js';

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.ChannelMessageView, dto);
    }

    async findOne(options = { uuid: null, user: null }) {
        ChannelAuditServiceValidator.findOne(options);

        const { user, uuid } = options;
        const r = await super.findOne({ uuid });

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: r.channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return r;
    }

    async findAll(options = { channel_uuid: null, user: null, page: null, limit: null }) {
        options = ChannelAuditServiceValidator.findAll(options);
        const { channel_uuid, user, page, limit } = options;

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return await super.findAll({ page, limit, where: { channel_uuid } });
    }
}

const service = new Service();

export default service;
