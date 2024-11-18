import RoomAuditServiceValidator from '../../shared/validators/room_audit_service_validator.js';
import ControllerError from '../../shared/errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/room_audit_dto.js';
import RoomAudit from '../mongoose/models/room_audit.js';
import Room from '../mongoose/models/room.js';

class Service {

    /**
     * @function findOne
     * @description Find a room audit by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Object}
     */
    async findOne(options = { uuid: null, user: null }) {
        RoomAuditServiceValidator.findOne(options);

        const roomAudit = await RoomAudit.findOne({ uuid: options.uuid }).populate('room');
        if (!roomAudit) throw new ControllerError(404, 'Room audit not found');

        if (!(await RoomPermissionService.isInRoom({ room_uuid: roomAudit.room.uuid, user: options.user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return dto(roomAudit);
    }

    /**
     * @function findAll
     * @description Find all room audits by room_uuid
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {Number} options.page
     * @param {Number} options.limit
     * @returns {Object}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = RoomAuditServiceValidator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const room = await Room.findOne({ uuid: room_uuid });
        if (!room) throw new ControllerError(404, 'Room not found');

        const params = { room: room._id };
        const total = await RoomAudit.find(params).countDocuments();
        const roomAudits = await RoomAudit.find(params)
            .sort({ created_at: -1 })
            .limit(limit || 0)
            .skip((page && limit) ? offset : 0);

        return {
            total,
            data: await Promise.all(roomAudits.map(async (roomAudit) => {
                return dto({ ...roomAudit._doc, room: { uuid: room_uuid } });
            })),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }
}

const service = new Service();

export default service;
