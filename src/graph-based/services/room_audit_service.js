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

        const { room_uuid, user, page, limit } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return super.findAll({ page, limit, override: {
            match: [
                'MATCH (ra:RoomAudit)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid})',
                'MATCH (ra)-[:HAS_ROOM_AUDIT_TYPE]->(rat:RoomAuditType)',
                'MATCH (ra)-[:HAS_USER]->(u:User)',
            ],
            return: ['ra', 'rat', 'u', 'r'],
            map: { model: 'ra', relationships: [
                { alias: 'r', to: 'room' },
                { alias: 'rat', to: 'room_audit_type' },
                { alias: 'u', to: 'user' },
            ]},
            params: { room_uuid }
        }}); 
    }
}

const service = new Service();

export default service;
