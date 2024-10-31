import dto from '../dto/type_dto.js';
import NeodeBaseFindService from './neode_base_find_service.js';
import ControllerError from '../../shared/errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';

class Service extends NeodeBaseFindService {
    constructor() {
        super('uuid', 'ChannelAudit', dto);
    }

    async findOne(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');

        const { uuid, user } = options;

        const channelAudit = await super.findOne({ uuid, eager: ['channel_audit_type', 'channel'] });
        if (!channelAudit) throw new ControllerError(404, 'Channel audit not found');

        const channel_uuid = channelAudit.channel_uuid;
        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return channelAudit;
    }

    async findAll(options = { channel_uuid: null, user: null, page: null, limit: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.channel_uuid) throw new ControllerError(400, 'No channel_uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');

        const { channel_uuid, user, page, limit } = options;

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return super.findAll({ page, limit, override: {
            match: [
                'MATCH (ca:ChannelAudit)-[:HAS_CHANNEL]->(c:Channel {uuid: $channel_uuid})',
                'MATCH (ca)-[:HAS_CHANNEL_AUDIT_TYPE]->(cat:ChannelAuditType)',
                'MATCH (ca)-[:HAS_USER]->(u:User)',
            ],
            return: ['ca', 'cat', 'u', 'c'],
            map: { model: 'ca', relationships: [
                { alias: 'cat', to: 'channelAuditType' },
                { alias: 'u', to: 'user' },
                { alias: 'c', to: 'channel' },
            ]},
            params: { channel_uuid }
        }}); 
    }
}

const service = new Service();

export default service;
