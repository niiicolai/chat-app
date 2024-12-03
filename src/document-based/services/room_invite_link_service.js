import Validator from '../../shared/validators/room_invite_link_service_validator.js';
import err from '../../shared/errors/index.js';
import RPS from './room_permission_service.js';
import dto from '../dto/room_invite_link_dto.js';
import Room from '../mongoose/models/room.js';
import Channel from '../mongoose/models/channel.js';
import ChannelMessage from '../mongoose/models/channel_message.js';
import mongoose from '../mongoose/index.js';
import User from '../mongoose/models/user.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @class RoomInviteLinkService
 * @description Service class for room invite links.
 * @exports RoomInviteLinkService
 */
class RoomInviteLinkService {

    /**
     * @function findOne
     * @description Find a room invite link by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const { uuid, user } = options;
        const room = await Room.findOne({ room_invite_links: { $elemMatch: { _id: uuid } } });
        const room_invite_link = room?.room_invite_links?.find(u => u._id === uuid);

        if (!room || !room_invite_link) throw new err.EntityNotFoundError('room_invite_link');

        const isInRoom = await RPS.isInRoom({ room_uuid: room._id, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto({ ...room_invite_link._doc, room: room._doc });
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
     * @returns {Promise<Object>}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = Validator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        const isInRoom = await RPS.isInRoom({ room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const params = { _id: room_uuid };
        const room = await Room.findOne(params)
            .sort({ created_at: -1 })
            .limit(limit || 0)
            .skip((page && limit) ? offset : 0);
        const total = room?.room_invite_links?.length || 0;

        return {
            total,
            data: room.room_invite_links.map((room_invite_link) => {
                return dto({ ...room_invite_link._doc, room: room._doc });
            }),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }

    /**
     * @function create
     * @description Create a room invite link for a room
     * @param {Object} options
     * @param {Object} options.body
     * @param {String} options.body.uuid
     * @param {String} options.body.room_uuid
     * @param {String} options.body.expires_at
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, user: null }) {
        Validator.create(options);

        const { body, user } = options;

        const room = await Room.findOne({ _id: body.room_uuid });
        if (!room) throw new err.EntityNotFoundError('room');

        const isAdmin = await RPS.isInRoom({ room_uuid: body.room_uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const uuidInUse = await Room.findOne({ room_invite_links: { $elemMatch: { _id: body.uuid } } });
        if (uuidInUse) throw new err.DuplicateEntryError('room_invite_link', 'PRIMARY', body.uuid);

        await Room.findOneAndUpdate(
            { _id: body.room_uuid },
            { $push: { room_invite_links: {
                _id: body.uuid,
                expires_at: body.expires_at,
                never_expires: body.expires_at ? false : true
            } } }
        );
        
        const updateRoom = await Room.findOne({ _id: body.room_uuid });
        const room_invite_link = updateRoom.room_invite_links.find(u => u._id === body.uuid);

        return dto({ ...room_invite_link._doc, room: room._doc });
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
     * @returns {Promise<Object>}
     */
    async update(options = { uuid: null, body: null, user: null }) {
        Validator.update(options);

        const { uuid, body, user } = options;
        const room = await Room.findOne({ room_invite_links: { $elemMatch: { _id: uuid } } });
        const room_invite_link = room?.room_invite_links?.find(u => u._id === uuid);

        if (!room_invite_link) throw new err.EntityNotFoundError('room_invite_link');

        const isAdmin = await RPS.isInRoom({ room_uuid: room._id, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const result = await Room.findOneAndUpdate(
            { 'room_invite_links._id': uuid },
            { $set: { 'room_invite_links.$.expires_at': body.expires_at } }
        );

        const updated_link = result.room_invite_links.find(u => u._id === uuid);

        return dto({ ...updated_link._doc, room });
    }

    /**
     * @function destroy
     * @description Destroy a room invite link by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null, user: null }) {
        Validator.destroy(options);

        const { uuid, user } = options;
        const room = await Room.findOne({ room_invite_links: { $elemMatch: { _id: uuid } } });
        const room_invite_link = room?.room_invite_links?.find(u => u._id === uuid);

        if (!room_invite_link) throw new err.EntityNotFoundError('room_invite_link');

        const isAdmin = await RPS.isInRoom({ room_uuid: room._id, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        room.room_invite_links = room.room_invite_links.filter(link => link._id !== uuid);

        await Room.findOneAndUpdate(
            { _id: room._id },
            { room_invite_links: room.room_invite_links }
        );
    }

    /**
     * @function join
     * @description Join a room using a room invite link
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<void>}
     */
    async join(options = { uuid: null, user: null }) {
        Validator.join(options);

        const { uuid, user } = options;

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const room = await Room.findOne({ room_invite_links: { $elemMatch: { _id: uuid } } })
                .populate('room_users.user room_join_settings.join_channel')
                .session(session);
            const room_invite_link = room?.room_invite_links?.find(u => u._id === uuid);

            if (!room_invite_link) throw new err.EntityNotFoundError('room_invite_link');
            if (room_invite_link.expires_at && new Date(room_invite_link.expires_at) < new Date()) {
                throw new err.EntityExpiredError('room_invite_link');
            }

            const [isVerified, isInRoom, countExceedsLimit] = await Promise.all([
                RPS.isVerified({ user }, session),
                RPS.isInRoom({ room_uuid: room._id, user }, session),
                RPS.roomUserCountExceedsLimit({ room_uuid: room._id, add_count: 1 }, session)
            ]);
            if (!isVerified) throw new err.VerifiedEmailRequiredError();
            if (isInRoom) throw new err.DuplicateRoomUserError();
            if (countExceedsLimit) throw new err.ExceedsRoomUserCountError();

            const savedUser = await User.findOne({ _id: user.sub }).session(session);
            if (!savedUser) throw new err.EntityNotFoundError('user');

            // Add user to room
            room.room_users.push({
                _id: uuidv4(),
                user: savedUser._id,
                room_user_role: "Member"
            });

            await Room.findOneAndUpdate(
                { _id: room._id },
                { room_users: room.room_users }
            ).session(session);

            // Find channel for sending join message
            const channelId = room.room_join_settings.join_channel
                ? room.room_join_settings.join_channel._id
                : (await Channel.findOne({ room: room._id }).session(session))?._id;

            if (channelId) {
                // Add username to join message
                let body = room.room_join_settings.join_message;
                if (body.includes('{name}')) {
                    body = body.replace('{name}', savedUser.username);
                }
        
                await new ChannelMessage({
                    _id: uuidv4(),
                    channel: channelId,
                    channel_message_type: "System",
                    body,
                }).save({ session });
            }

        } catch (error) {
            await session.abortTransaction();
            console.error(error);
            throw error;
        } finally {
            if (session.inTransaction()) {
                await session.commitTransaction();
            }

            session.endSession();
        }
    }
}

const service = new RoomInviteLinkService();

export default service;
