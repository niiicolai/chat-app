import Validator from '../../shared/validators/channel_audit_service_validator.js';
import err from '../../shared/errors/index.js';
import RPS from './room_permission_service.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/channel_audit_dto.js';
import neo4j from 'neo4j-driver';

/**
 * @class ChannelAuditService
 * @description Service class for channel audits.
 * @exports ChannelAuditService
 */
class ChannelAuditService {

    /**
     * @function findOne
     * @description Find a channel audit by uuid.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.user
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const { uuid, user } = options;

        const channelAudit = await neodeInstance.model('ChannelAudit').find(uuid);
        if (!channelAudit) throw new err.EntityNotFoundError('channel_audit');

        const channel = channelAudit.get('channel').endNode().properties();
        const channel_audit_type = channelAudit.get('channel_audit_type').endNode().properties();

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto({
            ...channelAudit.properties(),
            channel_audit_type,
            channel,
        });
    }

    /**
     * @function findAll
     * @description Find all channel audits.
     * @param {Object} options
     * @param {string} options.channel_uuid
     * @param {Object} options.user
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { channel_uuid: null, user: null, page: null, limit: null }) {
        options = Validator.findAll(options);

        const { channel_uuid, user, page, limit, offset } = options;

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

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

const service = new ChannelAuditService();

export default service;
