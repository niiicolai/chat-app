import dto from '../dto/type_dto.js';
import NeodeBaseFindService from './neode_base_find_service.js';
import ControllerError from '../../shared/errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';

class Service extends NeodeBaseFindService {
    constructor() {
        super('uuid', 'RoomAudit', dto);
    }

    async findOne(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');

        const { uuid, user } = options;

        const roomAudit = await super.findOne({ uuid, eager: ['room_audit_type', 'room'] });
        if (!roomAudit) throw new ControllerError(404, 'Room audit not found');

        const room_uuid = roomAudit.room_uuid;
        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return roomAudit;
    }

    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.room_uuid) throw new ControllerError(400, 'No room_uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');

        const { room_uuid, user } = options;
        let { page, limit } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        if (page && isNaN(page)) throw new ControllerError(400, 'page must be a number');
        if (page && page < 1) throw new ControllerError(400, 'page must be greater than 0');
        if (limit && limit < 1) throw new ControllerError(400, 'limit must be greater than 0');
        if (limit && isNaN(limit)) throw new ControllerError(400, 'limit must be a number');
        if (page && !limit) throw new ControllerError(400, 'page requires limit');
        if (page) page = parseInt(page);
        if (limit) limit = parseInt(limit);

        const props = { room_uuid };
        let cypher = 
            `MATCH (ra:RoomAudit)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid}) ` +
            `MATCH (ra)-[:HAS_ROOM_AUDIT_TYPE]->(rat:RoomAuditType) ` +
            `MATCH (ra)-[:HAS_USER]->(u:User) ` +
            `ORDER BY ra.created_at DESC `;

        if (page && limit) {
            cypher += ' SKIP $skip LIMIT $limit';
            props.skip = neo4j.int((page - 1) * limit);
            props.limit = neo4j.int(limit);
        }

        if (!page && limit) {
            cypher += ' LIMIT $limit';
            props.limit = neo4j.int(limit);
        }

        cypher += ` RETURN ra, rat, u, r`;
        
        const dbResult = await neodeInstance.cypher(cypher, props);
        const data = dbResult.records.map((record) => {
            const roomAudit = record.get('ra').properties;
            const rel = [];
            if (record.get('rat')) rel.push({ roomAuditType: record.get('rat').properties });
            if (record.get('r')) rel.push({ room: record.get('r').properties });
            if (record.get('u')) rel.push({ user: record.get('u').properties });
            return this.dto(roomAudit, rel);
        });
        const count = await neodeInstance.cypher(
            `MATCH (ra:RoomAudit)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid}) RETURN count(ra)`,
            { room_uuid }
        );
        const total = count.records[0]?.get('count(ra)').low || 0;
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
