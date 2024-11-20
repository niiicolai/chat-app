import RoomInviteLinkServiceValidator from '../../shared/validators/room_invite_link_service_validator.js';
import ControllerError from '../../shared/errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/room_invite_link_dto.js';
import Room from '../mongoose/models/room.js';
import RoomUserRole from '../mongoose/models/room_user_role.js';
import Channel from '../mongoose/models/channel.js';
import ChannelMessage from '../mongoose/models/channel_message.js';
import ChannelMessageType from '../mongoose/models/channel_message_type.js';
import User from '../mongoose/models/user.js';
import { v4 as uuidv4 } from 'uuid';

class Service {

    /**
     * @function findOne
     * @description Find a room invite link by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Object}
     */
    async findOne(options = { uuid: null, user: null }) {
        RoomInviteLinkServiceValidator.findOne(options);

        const room = await Room.findOne({ room_invite_links: { $elemMatch: { uuid: options.uuid } } });
        const room_invite_link = room?.room_invite_links?.find(u => u.uuid === options.uuid);

        if (!room) throw new ControllerError(404, 'Room Invite Link not found');
        if (!room_invite_link) throw new ControllerError(404, 'Room Invite Link not found');

        if (!(await RoomPermissionService.isInRoom({ room_uuid: room.uuid, user: options.user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }
        
        return dto({ ...room_invite_link._doc, room });
    }

    /**
     * @function findAll
     * @description Find all room invite links by room_uuid
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {Number} options.page
     * @param {Number} options.limit
     * @returns {Object}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = RoomInviteLinkServiceValidator.findAll(options);
        const { room_uuid, user, page, limit, offset } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }
        
        const params = { uuid: room_uuid };
        const room = await Room.findOne(params)
            .populate('room_invite_links')
            .sort({ created_at: -1 })
            .limit(limit || 0)
            .skip((page && limit) ? offset : 0);
        
        return {
            total: room.room_invite_links.length,
            data: await Promise.all(room.room_invite_links.map(async (room_invite_link) => {
                return dto({ ...room_invite_link._doc, room: { uuid: room_uuid } });
            })),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(room.room_invite_links.length / limit) }),
        };
    }

    /**
     * @function create
     * @description Create a room invite link for a room
     * @param {Object} options
     * @param {Object} options.body
     * @param {String} options.body.room_uuid
     * @param {String} options.body.expires_at
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Object}
     */
    async create(options = { body: null, user: null }) {
        RoomInviteLinkServiceValidator.create(options);
        const { body, user } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid: body.room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }
        
        const room = await Room.findOne({ uuid: body.room_uuid });
        if (!room) throw new ControllerError(404, 'Room not found');

        room.room_invite_links.push(body);
        await room.save();

        const roomUpdated = await Room.findOne({ uuid: body.room_uuid });
        const room_invite_link = roomUpdated.room_invite_links[room.room_invite_links.length - 1];

        return dto({ ...room_invite_link._doc, room });
    }

    /**
     * @function update
     * @description Update a room invite link by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.body
     * @param {String} options.body.expires_at
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Object}
     */
    async update(options = { uuid: null, body: null, user: null }) {
        RoomInviteLinkServiceValidator.update(options);

        const room = await Room.findOne({ room_invite_links: { $elemMatch: { uuid: options.uuid } } });
        const room_invite_link = room?.room_invite_links?.find(u => u.uuid === options.uuid);

        if (!room) throw new ControllerError(404, 'Room not found');
        if (!room_invite_link) throw new ControllerError(404, 'Room Invite Link not found');
        if (!(await RoomPermissionService.isInRoom({ room_uuid: room.uuid, user: options.user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        room_invite_link.expires_at = options.body.expires_at;
        
        await room.save();

        return dto({...room_invite_link._doc, room});
    }

    /**
     * @function destroy
     * @description Destroy a room invite link by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {void}
     */
    async destroy(options = { uuid: null, user: null }) {
        RoomInviteLinkServiceValidator.destroy(options);

        const room = await Room.findOne({ room_invite_links: { $elemMatch: { uuid: options.uuid } } });
        const room_invite_link = room?.room_invite_links?.find(u => u.uuid === options.uuid);

        if (!room) throw new ControllerError(404, 'Room not found');
        if (!room_invite_link) throw new ControllerError(404, 'Room Invite Link not found');
        if (!(await RoomPermissionService.isInRoom({ room_uuid: room.uuid, user: options.user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        await Room.findOneAndUpdate({ uuid: room.uuid }, { $pull: { room_invite_links: { uuid: options.uuid } } });
    }

    /**
     * @function join
     * @description Join a room using a room invite link
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {void}
     */
    async join(options = { uuid: null, user: null }) {
        RoomInviteLinkServiceValidator.join(options);

        const room = await Room.findOne({ room_invite_links: { $elemMatch: { uuid: options.uuid } } })
            .populate('room_users.user room_users.room_user_role room_join_settings.join_channel');
        const room_invite_link = room?.room_invite_links?.find(u => u.uuid === options.uuid);

        if (!room) throw new ControllerError(404, 'Room not found');
        if (!room_invite_link) throw new ControllerError(404, 'Room Invite Link not found');
        if (room_invite_link.expires_at && new Date(room_invite_link.expires_at) < new Date())
            throw new ControllerError(400, 'Room Invite Link has expired');
        if (!(await RoomPermissionService.isVerified({ user: options.user })))
            throw new ControllerError(403, 'You must verify your email before you can join a room');
        if (await RoomPermissionService.isInRoom({ room_uuid: room.uuid, user: options.user, role_name: null }))
            throw new ControllerError(400, 'User is already in room');
        if (await RoomPermissionService.roomUserCountExceedsLimit({ room_uuid: room.uuid, add_count: 1 }))
            throw new ControllerError(400, 'Room user count exceeds limit. The room cannot have more users');

        const [room_user_role, savedUser, channel_message_type] = await Promise.all([
            RoomUserRole.findOne({ name: 'Member' }),
            User.findOne({ uuid: options.user.sub }),
            ChannelMessageType.findOne({ name: 'System' })
        ]);

        if (!room_user_role) throw new ControllerError(500, 'room_user_role not found');
        if (!savedUser) throw new ControllerError(404, 'User not found');
        if (!channel_message_type) throw new ControllerError(500, 'channel_message_type not found');

        room.room_users.push({
            uuid: uuidv4(),
            user: savedUser._id,
            room_user_role,
        });

        await room.save();

        const channelId = room.room_join_settings.join_channel
            ? room.room_join_settings.join_channel._id
            : (await Channel.findOne({ room: room._id }))?._id;

        if (channelId) {
            let body = room.room_join_settings.join_message;
            if (body.includes('{name}')) {
                body = body.replace('{name}', savedUser.username);
            }

            await new ChannelMessage({
                uuid: uuidv4(),
                channel: channelId,
                channel_message_type,
                body,
            }).save();
        }
    }
}

const service = new Service();

export default service;
