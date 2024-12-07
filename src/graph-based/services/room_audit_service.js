import Validator from '../../shared/validators/room_audit_service_validator.js';
import err from '../../shared/errors/index.js';
import RPS from './room_permission_service.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/room_audit_dto.js';
import neo4j from 'neo4j-driver';

/**
 * @class RoomAuditService
 * @description Service class for room audits
 * @exports RoomAuditService
 */
class RoomAuditService {

    /**
     * @function findOne
     * @description Find a room audit by uuid
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const { uuid, user } = options;
        const roomAudit = await neodeInstance.model('RoomAudit').find(uuid);
        if (!roomAudit) throw new err.EntityNotFoundError('room_audit');

        const room = roomAudit.get('room').endNode().properties();
        const room_audit_type = roomAudit.get('room_audit_type').endNode().properties();

        const isInRoom = await RPS.isInRoom({ room_uuid: room.uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto({
            ...roomAudit.properties(),
            room_audit_type,
            room, 
        });
    }

    /**
     * @function findAll
     * @description Find all room audits in a room
     * @param {Object} options
     * @param {string} options.room_uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = Validator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        const isInRoom = await RPS.isInRoom({ room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const result = await neodeInstance.batch([
            { query:
                `MATCH (ra:RoomAudit)-[:AUDIT_BY]->(r:Room {uuid: $room_uuid}) ` +
                `MATCH (ra)-[:TYPE_IS]->(rat:RoomAuditType) ` +
                `ORDER BY ra.created_at DESC ` +
                (offset ? `SKIP $offset `:``) + 
                (limit ? `LIMIT $limit ` : ``) +
                `RETURN ra, r, rat`,
              params: {
                room_uuid,
                ...(offset && { offset: neo4j.int(offset) }),
                ...(limit && { limit: neo4j.int(limit) }),
              }
            }, 
            { query: 
                `MATCH (ra:RoomAudit)-[:AUDIT_BY]->(r:Room {uuid: $room_uuid}) ` +
                `RETURN COUNT(ra) AS count`, 
              params: {
                room_uuid,
              } 
            },
        ]);
        const total = result[1].records[0].get('count').low;
        return {
            total, 
            data: result[0].records.map(record => dto({
                ...record.get('ra').properties,
                room: record.get('r').properties,
                room_audit_type: record.get('rat').properties,
            })),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }
}

const service = new RoomAuditService();

export default service;
