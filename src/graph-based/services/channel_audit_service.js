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

        const { channel_uuid, user } = options;
        let { page, limit } = options;

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        if (page && isNaN(page)) throw new ControllerError(400, 'page must be a number');
        if (page && page < 1) throw new ControllerError(400, 'page must be greater than 0');
        if (limit && limit < 1) throw new ControllerError(400, 'limit must be greater than 0');
        if (limit && isNaN(limit)) throw new ControllerError(400, 'limit must be a number');
        if (page && !limit) throw new ControllerError(400, 'page requires limit');
        if (page) page = parseInt(page);
        if (limit) limit = parseInt(limit);

        const props = { channel_uuid };
        let cypher = 
            `MATCH (ca:ChannelAudit)-[:HAS_CHANNEL]->(c:Channel {uuid: $channel_uuid}) ` +
            `MATCH (ca)-[:HAS_CHANNEL_AUDIT_TYPE]->(cat:ChannelAuditType) ` +
            `MATCH (ca)-[:HAS_USER]->(u:User) ` +
            `ORDER BY ca.created_at DESC `;

        if (page && limit) {
            cypher += ' SKIP $skip LIMIT $limit';
            props.skip = neo4j.int((page - 1) * limit);
            props.limit = neo4j.int(limit);
        }

        if (!page && limit) {
            cypher += ' LIMIT $limit';
            props.limit = neo4j.int(limit);
        }

        cypher += ` RETURN ca, cat, u, c`;
        
        const dbResult = await neodeInstance.cypher(cypher, props);
        const data = dbResult.records.map((record) => {
            const channelAudit = record.get('ca').properties;
            const rel = [];
            if (record.get('cat')) rel.push({ channelAuditType: record.get('cat').properties });
            if (record.get('u')) rel.push({ user: record.get('u').properties });
            if (record.get('c')) rel.push({ channel: record.get('c').properties });
            return this.dto(channelAudit, rel);
        });
        const count = await neodeInstance.cypher(
            `MATCH (ca:ChannelAudit)-[:HAS_CHANNEL]->(c:Channel {uuid: $channel_uuid}) RETURN count(ca)`,
            { channel_uuid }
        );
        const total = count.records[0]?.get('count(ca)').low || 0;
        const result = { data, total };

        if (page && limit) {
            result.page = page;
            result.pages = Math.ceil(total / limit);
        }

        if (limit) result.limit = limit;

        return result;
    }
}

const service = new Service();

export default service;
