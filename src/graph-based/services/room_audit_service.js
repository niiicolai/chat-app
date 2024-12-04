import RoomAuditServiceValidator from '../../shared/validators/room_audit_service_validator.js';
import ControllerError from '../../shared/errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/room_audit_dto.js';
import neo4j from 'neo4j-driver';

/**
 * @class RoomAuditService
 * @description Service class for room audits
 * @exports RoomAuditService
 */
class RoomAuditService {

    async findOne(options = { uuid: null, user: null }) {
        RoomAuditServiceValidator.findOne(options);

        const { uuid, user } = options;
        const roomAudit = await neodeInstance.model('RoomAudit').find(uuid);
        if (!roomAudit) throw new ControllerError(404, 'room_audit not found');

        const room = roomAudit.get('room').endNode().properties();
        const room_audit_type = roomAudit.get('room_audit_type').endNode().properties();

        if (!(await RoomPermissionService.isInRoom({ room_uuid: room.uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return dto({
            ...roomAudit.properties(),
            room_audit_type,
            room, 
        });
    }

    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = RoomAuditServiceValidator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const result = await neodeInstance.batch([
            { query:
                `MATCH (ra:RoomAudit)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid}) ` +
                `ORDER BY ra.created_at DESC ` +
                (offset ? `SKIP $offset `:``) + (limit ? `LIMIT $limit ` : ``) +
                `RETURN ra`,
              params: {
                room_uuid,
                ...(offset && { offset: neo4j.int(offset) }),
                ...(limit && { limit: neo4j.int(limit) }),
              }
            }, 
            { query: 
                `MATCH (ra:RoomAudit)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid}) ` +
                `RETURN COUNT(ra) AS count`, 
              params: {
                room_uuid,
              } 
            },
        ]);
        const total = result[1].records[0].get('count').low;
        return {
            total, 
            data: result[0].records.map(record => dto(record.get('ra').properties)),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }
}

const service = new RoomAuditService();

export default service;
