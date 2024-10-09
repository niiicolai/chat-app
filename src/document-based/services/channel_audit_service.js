import MongodbBaseFindService from './_mongodb_base_find_service.js';
import ControllerError from '../../errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import ChannelAudit from '../../../mongoose/models/channel_audit.js';
import Channel from '../../../mongoose/models/channel.js';
import dto from '../dto/channel_audit_dto.js';

class Service extends MongodbBaseFindService {
    constructor() {
        super(ChannelAudit, dto, 'name');
    }

    async findOne(options = { uuid: null, user: null }) {
        const { uuid, user } = options;
        const channelAudit = await super.findOne({ uuid });
        
        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: channelAudit.channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return channelAudit;
    }

    async findAll(options = { channel_uuid: null, user: null, page: null, limit: null }) {
        const { channel_uuid, user, page, limit } = options;

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!channel_uuid) {
            throw new ControllerError(400, 'No channel_uuid provided');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const channel = await Channel.findOne({ uuid: channel_uuid });

        return await super.findAll({ page, limit }, (query) => query, { channel: channel._id });
    }
}

const service = new Service();

export default service;

