import Validator from '../../shared/validators/room_audit_service_validator.js';
import err from '../../shared/errors/index.js';
import RPS from './room_permission_service.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/room_audit_dto.js';

/**
 * @class RoomAuditService
 * @description Service class for Room audits.
 * @exports RoomAuditService
 */
class RoomAuditService {

    /**
     * @function findOne
     * @description Find a room audit by UUID.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const { uuid, user } = options;
        const entity = await db.RoomAuditView.findByPk(uuid);
        if (!entity) throw new err.EntityNotFoundError('room_audit');

        const isInRoom = await RPS.isInRoom({ room_uuid: entity.room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto(entity);
    }

    /**
     * @function findAll
     * @description Find all room audits by room UUID.
     * @param {Object} options
     * @param {string} options.room_uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = Validator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        const room = await db.RoomView.findOne({ uuid: room_uuid });
        if (!room) throw new err.EntityNotFoundError('room');

        const isInRoom = await RPS.isInRoom({ room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const [total, data] = await Promise.all([
            db.RoomAuditView.count({ where: { room_uuid } }),
            db.RoomAuditView.findAll({
                where: { room_uuid },
                ...(limit && { limit }),
                ...(offset && { offset }),
                order: [['room_audit_created_at', 'DESC']]
            })
        ]);

        return {
            data: data.map(entity => dto(entity)),
            total,
            ...(limit && { limit }),
            ...(page && { page }),
            ...(page && { pages: Math.ceil(total / limit) })
        };
    }
}

const service = new RoomAuditService();

export default service;
