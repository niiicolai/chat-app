import userRoomModel from '../models/user_room.js';
import userRoomDto from '../dtos/user_room.js';
import channelModel from '../models/channel.js';
import channelDto from '../dtos/channel.js';

/**
 * @class RoomPermissionService
 * @description service for room permissions
 * @exports RoomPermissionService
 */
class RoomPermissionService {

    /**
     * @function isUserInRoom
     * @description Check if a user is in a room
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Object} options.user
     * @param {String} options.room_role_name
     * @param {Array} options.room_role_names
     * @returns {Promise}
     */
    async isUserInRoom(options = { room_uuid: null, user: null, room_role_name: null, room_role_names: null }) {
        const userRoom = await userRoomModel
            .throwIfNotPresent(options.room_uuid, 'room_uuid is required')
            .throwIfNotPresent(options.user.sub, 'user_uuid is required')
            .find()
            .where('user_uuid', options.user.sub)
            .where('room_uuid', options.room_uuid)
            .dto(userRoomDto)
            .executeOne();
        
        if (options.room_role_name) {
            return userRoom && userRoom.room_role_name == options.room_role_name;
        }
        
        if (options.room_role_names) {
            console.log('options.room_role_names', options.room_role_names);
            return userRoom && options.room_role_names.includes(userRoom.room_role_name);
        }

        return userRoom ? true : false;
    }

    /**
     * @function isChannelInRoom
     * @description Check if a channel is in a room
     * @param {Object} options
     * @param {String} options.user
     * @param {String} options.channel_uuid
     * @param {String} options.room_role_name
     * @param {Array} options.room_role_names
     * @returns {Promise}
     */    
    async isUserAndChannelInRoom(options = { channel_uuid: null, user: null, room_role_name: null, room_role_names: null }) {
        const channel = await channelModel
            .throwIfNotPresent(options.channel_uuid, 'channel_uuid is required')
            .find()
            .where('uuid', options.channel_uuid)
            .dto(channelDto)
            .executeOne();

        return await this.isUserInRoom({
            room_uuid: channel.room_uuid,
            user: options.user,
            room_role_name: options.room_role_name,
            room_role_names: options.room_role_names
        });
    }
}

const service = new RoomPermissionService();

export default service;
