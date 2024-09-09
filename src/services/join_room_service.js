import roomInviteLinkmodel from '../models/room_invite_link.js';
import roomInviteLinkDto from '../dtos/room_invite_link.js';
import ControllerError from '../errors/controller_error.js';
import RoomService from './room_service.js';
import UserRoomService from './user_room_service.js';
import RoomSettingService from './room_setting_service.js';
import ChannelService from './channel_service.js';
import ChannelMessageService from './channel_message_service.js';
import RoomPermissionService from './room_permission_service.js';
import { v4 as uuidV4 } from 'uuid';
import UserService from './user_service.js';

/**
 * @class JoinRoomService
 * @description service class for joining a room.
 * @exports JoinRoomService
 */
class JoinRoomService {

    /**
     * @function joinLink
     * @description Join a room invite link.
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {Object} transaction
     * @returns {Promise<Object>}
     */
    async joinLink(options = { uuid: null, user: null }, transaction) {
        const { uuid, user } = options;

        /**
         * Get the room invite link to be joined.
         */
        const roomInviteLink = await roomInviteLinkmodel
            .throwIfNotPresent(uuid, 'uuid is required')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where('uuid', uuid)
            .throwIfNotFound()
            .dto(roomInviteLinkDto)
            .executeOne();

        /**
         * Ensure the room invite link is not expired.
         * If expires_at is null, the link never expires.
         */
        if (roomInviteLink.expires_at) {
            const expiresAt = new Date(roomInviteLink.expires_at);
            if (expiresAt < new Date()) throw new ControllerError(400, 'Link expired');
        }
        /**
         * Ensure the user is not already a member of the room.
         */
        if (await RoomPermissionService.isUserInRoom({
            room_uuid: roomInviteLink.room_uuid,
            user,
            room_role_name: null
        })) throw new ControllerError(400, 'Already a member');

        /**
         * Find the room setting for the room.
         * And the number of members in the room.
         * And ensure the room is not full.
         */
        const roomSetting = await RoomSettingService.findOne({ room_uuid: roomInviteLink.room_uuid });
        const userRoomsCount = await UserRoomService.count({ where: { room_uuid: roomInviteLink.room_uuid } });
        if (userRoomsCount >= roomSetting.max_members) throw new ControllerError(400, 'Room is full');

        await roomInviteLinkmodel.defineTransaction(async (t) => {
            await UserRoomService.create({
                body: { uuid: uuidV4(), room_uuid: roomInviteLink.room_uuid, room_role_name: 'Member'},
                user
            }, t);

            /**
             * Find a welcome channel.
             * If the room settings defines one, use that,
             * otherwise, use the first channel in the room.
             */
            let channel = null;
            const skipPermissionCheck = true;
            if (roomSetting.join_channel_uuid) {
                channel = await ChannelService.findOne({ pk: roomSetting.join_channel_uuid, user }, skipPermissionCheck);
            } else {
                const channels = await ChannelService.findAll({ room_uuid: roomInviteLink.room_uuid, user }, skipPermissionCheck);
                if (channels.data.length > 0) channel = channels.data[0];
            }

            /**
             * if a channel is found, create a welcome message.
             * The message is either the default message or the one
             * defined in the room settings.
             */
            if (channel) {
                /**
                 * Get the user.
                 */
                const me = await UserService.me(user);
                const body = `${me.username} ${roomSetting.join_message || process.env.ROOM_JOIN_MESSAGE}`;
                const definedBySystem = 1;
                const skipPermissionCheck = true;
                ChannelMessageService.create({
                    body: { uuid: uuidV4(), channel_uuid: channel.uuid, user_uuid: user.sub, body },
                    user
                }, t, definedBySystem, skipPermissionCheck);
            }
        }, transaction);

        /**
         * Return the room that was joined.
         */
        return await RoomService.findOne({ pk: roomInviteLink.room_uuid, user });
    }
}

const service = new JoinRoomService();

export default service;
