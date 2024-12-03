import Validator from '../../shared/validators/room_audit_service_validator.js';
import err from '../../shared/errors/index.js';
import RPS from './room_permission_service.js';
import dto from '../dto/room_audit_dto.js';
import RoomAudit from '../mongoose/models/room_audit.js';
import Room from '../mongoose/models/room.js';

/**
 * @class RoomAuditService
 * @description Service class for room audits.
 * @exports RoomAuditService
 */
class RoomAuditService {

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
        Validator.findOne(options);

        const { uuid, user } = options;
        const roomAudit = await RoomAudit.findOne({ _id: uuid }).populate('room');
        if (!roomAudit) throw new err.EntityNotFoundError('room_audit');

        const isInRoom = await RPS.isInRoom({ room_uuid: roomAudit.room._id, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto(roomAudit._doc);
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
        options = Validator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        const isInRoom = await RPS.isInRoom({ room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const room = await Room.findOne({ _id: room_uuid });
        if (!room) throw new err.EntityNotFoundError('room');

        const params = { room: room_uuid };
        const [total, data] = await Promise.all([
            RoomAudit.find(params).countDocuments(),
            RoomAudit.find(params)
                .sort({ created_at: -1 })
                .limit(limit || 0)
                .skip((page && limit) ? offset : 0)
                .then((audits) => audits.map((audit) => dto({ 
                    ...audit._doc, room: room._doc,
                }))),
        ]);

        return {
            total,
            data,
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }
}

const service = new RoomAuditService();

export default service;
