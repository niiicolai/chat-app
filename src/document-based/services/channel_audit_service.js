import Validator from '../../shared/validators/channel_audit_service_validator.js';
import err from '../../shared/errors/index.js';
import RPS from './room_permission_service.js';
import ChannelAudit from '../mongoose/models/channel_audit.js';
import Channel from '../mongoose/models/channel.js';
import dto from '../dto/channel_audit_dto.js';

/**
 * @class ChannelAuditService
 * @description Service class for channel audits.
 * @exports ChannelAuditService
 */
class ChannelAuditService {

    /**
     * @function findOne
     * @description Find a channel audit by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Object}
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const { uuid, user } = options;

        const channelAudit = await ChannelAudit.findOne({ _id: uuid }).populate('channel');
        if (!channelAudit) throw new err.EntityNotFoundError('channel_audit');

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid: channelAudit.channel._id, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto(channelAudit._doc);
    }

    /**
     * @function findAll
     * @description Find all channel audits by channel_uuid
     * @param {Object} options
     * @param {String} options.channel_uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {Number} options.page
     * @param {Number} options.limit
     * @returns {Object}
     */
    async findAll(options = { channel_uuid: null, user: null, page: null, limit: null }) {
        options = Validator.findAll(options);

        const { channel_uuid, user, page, limit, offset } = options;

        const channel = await Channel.findOne({ _id: channel_uuid });
        if (!channel) throw new err.EntityNotFoundError('channel');

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const params = { channel: channel._id };
        const [total, channelAudits] = await Promise.all([
            ChannelAudit.find(params).countDocuments(),
            ChannelAudit.find(params)
                .populate('channel')
                .sort({ created_at: -1 })
                .limit(limit || 0)
                .skip((page && limit) ? offset : 0),
        ]);

        return {
            total,
            data: channelAudits.map((channelAudit) => {
                return dto({
                    ...channelAudit._doc,
                    channel: { uuid: channel._id },
                })
            }),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }
}

const service = new ChannelAuditService();

export default service;

