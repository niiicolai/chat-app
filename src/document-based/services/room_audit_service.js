import MongodbBaseFindService from './_mongodb_base_find_service.js';
import ControllerError from '../../errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/room_audit_dto.js';
import RoomAudit from '../../../mongoose/models/room_audit.js';
import Room from '../../../mongoose/models/room.js';

class Service extends MongodbBaseFindService {
    constructor() {
        super(RoomAudit, dto, 'uuid');
    }

    async findOne(options = { uuid: null, user: null }) {
        const { user, uuid } = options;
        const roomAudit = await super.findOne({ uuid }, (query) => query.populate('room'));

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid: roomAudit.room.uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return roomAudit;
    }

    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        const { room_uuid, user, page, limit } = options;

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const room = await Room.findOne({ uuid: room_uuid });
        if (!room) {
            throw new ControllerError(404, 'Room not found');
        }
        
        return await super.findAll({ page, limit }, (query) => query.populate('room'), { room: room._id });
    }
}

const service = new Service();

export default service;
