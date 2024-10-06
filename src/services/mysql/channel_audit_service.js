import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';
import ControllerError from '../../errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';

const dto = (m) => {
    return {
        uuid: m.channel_audit_uuid,
        body: m.channel_audit_body,
        type: m.channel_audit_type_name,
        channel_uuid: m.channel_uuid,
        room_uuid: m.room_uuid,
        created_at: m.channel_audit_created_at,
        updated_at: m.channel_audit_updated_at,
    };
};

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.ChannelMessageView, dto);
    }

    async findOne(options = { user: null }) {
        const { user } = options;
        const r = await super.findOne({ ...options });
        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: r.channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }
        return r;
    }

    async findAll(options = { channel_uuid: null, user: null }) {
        const { channel_uuid, user } = options;
        if (!channel_uuid) {
            throw new ControllerError(400, 'No channel_uuid provided');
        }
        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }
        return await super.findAll({ ...options, where: { channel_uuid } });
    }
}

const service = new Service();

export default service;

