import ChannelAuditServiceValidator from '../../shared/validators/channel_audit_service_validator.js';
import ControllerError from '../../shared/errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import ChannelAudit from '../mongoose/models/channel_audit.js';
import Channel from '../mongoose/models/channel.js';
import dto from '../dto/channel_audit_dto.js';

class Service {

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
        ChannelAuditServiceValidator.findOne(options);

        const { uuid, user } = options;

        const channelAudit = await ChannelAudit.findOne({ uuid }).populate('channel');
        if (!channelAudit) throw new ControllerError(404, 'channel_audit not found');

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: channelAudit.channel.uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return dto(channelAudit);
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
        options = ChannelAuditServiceValidator.findAll(options);

        const { channel_uuid, user, page, limit, offset } = options;

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const channel = await Channel.findOne({ uuid: channel_uuid });
        if (!channel) throw new ControllerError(404, 'Channel not found');

        const params = { channel: channel._id };
        const total = await ChannelAudit.find(params).countDocuments();
        const channelAudits = await ChannelAudit.find(params)
            .populate('channel')
            .sort({ created_at: -1 })
            .limit(limit || 0)
            .skip((page && limit) ? offset : 0);

        return {
            total,
            data: await Promise.all(channelAudits.map(async (channelAudit) => {
                return dto({
                    ...channelAudit._doc,
                    channel: { uuid: channel.uuid },
                });
            })),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }
}

const service = new Service();

export default service;

