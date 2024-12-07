import ChannelAuditServiceValidator from '../../shared/validators/channel_audit_service_validator.js';
import err from '../../shared/errors/index.js';
import db from '../sequelize/models/index.cjs';
import RPS from './room_permission_service.js';
import dto from '../dto/channel_audit_dto.js';

/**
 * @class ChannelAuditService
 * @description Service class for channel audits.
 * @exports ChannelAuditService
 */
class ChannelAuditService {

    /**
     * @function findOne
     * @description Find a channel audit by UUID.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        ChannelAuditServiceValidator.findOne(options);

        const { uuid, user } = options;
        const entity = await db.ChannelAuditView.findByPk(uuid);

        if (!entity) throw new err.EntityNotFoundError('channel_audit');

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid: entity.channel_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto(entity);
    }

    /**
     * @function findAll
     * @description Find all channel audits by channel UUID.
     * @param {Object} options
     * @param {string} options.channel_uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { channel_uuid: null, user: null, page: null, limit: null }) {
        options = ChannelAuditServiceValidator.findAll(options);

        const { channel_uuid, user, page, limit, offset } = options;

        const channel = await db.ChannelView.findOne({ uuid: channel_uuid });
        if (!channel) throw new err.EntityNotFoundError('channel');

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const [total, data] = await Promise.all([
            db.ChannelAuditView.count({ channel_uuid }),
            db.ChannelAuditView.findAll({
                where: { channel_uuid },
                ...(limit && { limit }),
                ...(offset && { offset })
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

const service = new ChannelAuditService();

export default service;
