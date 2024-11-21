import ChannelAuditServiceValidator from '../../shared/validators/channel_audit_service_validator.js';
import ControllerError from '../../shared/errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/channel_audit_dto.js';
import neo4j from 'neo4j-driver';

class Service {

    async findOne(options = { uuid: null, user: null }) {
        ChannelAuditServiceValidator.findOne(options);

        const { uuid, user } = options;

        const channelAudit = await neodeInstance.model('ChannelAudit').find(uuid);
        if (!channelAudit) throw new ControllerError(404, 'channel_audit not found');

        const channel = channelAudit.get('channel').endNode().properties();
        const channel_audit_type = channelAudit.get('channel_audit_type').endNode().properties();

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: channel.uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return dto({
            ...channelAudit.properties(),
            channel_audit_type,
            channel,
        });
    }

    async findAll(options = { channel_uuid: null, user: null, page: null, limit: null }) {
        options = ChannelAuditServiceValidator.findAll(options);

        const { channel_uuid, user, page, limit, offset } = options;

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const result = await neodeInstance.batch([
            { query:
                `MATCH (ca:ChannelAudit)-[:HAS_CHANNEL]->(c:Channel {uuid: $channel_uuid}) ` +
                `MATCH (ca)-[:HAS_AUDIT_TYPE]->(cat:ChannelAuditType) ` +
                `ORDER BY ca.created_at DESC ` +
                (offset ? `SKIP $offset `:``) + (limit ? `LIMIT $limit ` : ``) +
                `RETURN ca, cat`,
              params: {
                channel_uuid,
                ...(offset && { offset: neo4j.int(offset) }),
                ...(limit && { limit: neo4j.int(limit) }),
              }
            }, 
            { query: 
                `MATCH (ca:ChannelAudit)-[:HAS_CHANNEL]->(c:Channel {uuid: $channel_uuid}) ` +
                `RETURN COUNT(ca) AS count`, 
              params: {
                channel_uuid,
              } 
            },
        ]);
        const total = result[1].records[0].get('count').low;
        return {
            total, 
            data: result[0].records.map(record => dto({
                ...record.get('ca').properties,
                channel_audit_type: record.get('cat').properties,
                channel: { uuid: channel_uuid },
            })),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }
}

const service = new Service();

export default service;
