import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';
import ControllerError from '../../errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../../dto/channel_audit_dto.js';

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.ChannelMessageView, (m) => dto(m, 'channel_audit_'));
    }

    async findOne(options = { user: null }) {
        const { user } = options;
        const r = await super.findOne({ ...options });
        
        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }
        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: r.channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }
        return r;
    }

    async findAll(options = { channel_uuid: null, user: null }) {
        const { channel_uuid, user } = options;

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }
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

