import RoomPermissionServiceValidator from '../../shared/validators/room_permission_service_validator.js';
import db from '../sequelize/models/index.cjs';

/**
 * @class RoomPermissionService
 * @description Service class for room permissions.
 * @exports RoomPermissionService
 */
class RoomPermissionService {

    /**
     * @function isVerified
     * @description Check if a user's email is verified.
     * @param {Object} options
     * @param {Object} options.user
     * @param {string} options.user.sub
     * @param {Object} options.transaction optional
     * @returns {Promise<boolean>}
     */
    async isVerified(options = { user: null }, transaction = null) {
        RoomPermissionServiceValidator.isVerified(options);
        
        const userEmailVerification = await db.UserEmailVerificationView.findOne({
            where: { user_uuid: options.user.sub },
            ...(transaction && { transaction }),
        });
        
        return userEmailVerification && userEmailVerification.user_email_verified;
    }

    /**
     * @function isInRoom
     * @description Check if a user is a member of a room.
     * @param {Object} options
     * @param {string} options.room_uuid
     * @param {Object} options.user
     * @param {string} options.user.sub
     * @param {string} options.role_name
     * @param {Object} options.transaction optional
     * @returns {Promise<boolean>}
     */
    async isInRoom(options = { room_uuid: null, user: null, role_name: null }, transaction = null) {
        RoomPermissionServiceValidator.isInRoom(options);

        const { room_uuid, user } = options;

        const roomUser = await db.RoomUserView.findOne({
            where: { room_uuid, user_uuid: user.sub },
            ...(transaction && { transaction }),
        });
        if (!roomUser) return false;

        return options.role_name ? roomUser.room_user_role_name === options.role_name : true;
    }

    /**
     * @function isInRoomByChannel
     * @description Check if a user is a member of a room by channel.
     * @param {Object} options
     * @param {string} options.channel_uuid
     * @param {Object} options.user
     * @param {string} options.user.sub
     * @param {string} options.role_name
     * @param {Object} options.transaction optional
     * @returns {Promise<boolean>}
     */
    async isInRoomByChannel(options = { channel_uuid: null, user: null, role_name: null }, transaction = null) {
        RoomPermissionServiceValidator.isInRoomByChannel(options);

        const { channel_uuid, user } = options;

        const channel = await db.ChannelView.findOne({ 
            where: { channel_uuid }, 
            ...(transaction && { transaction }) 
        });
        if (!channel) return false;

        const roomUser = await db.RoomUserView.findOne({ 
            where: { room_uuid: channel.room_uuid, user_uuid: user.sub },
            ...(transaction && { transaction }) 
        });
        if (!roomUser) return false;

        return options.role_name ? roomUser.room_user_role_name === options.role_name : true;
    }

    /**
     * @function fileExceedsTotalFilesLimit
     * @description Check if adding x number of bytes to a room exceeds the total files limit.
     * @param {Object} options
     * @param {string} options.room_uuid
     * @param {number} options.bytes
     * @param {Object} options.transaction optional
     * @returns {Promise<boolean>}
     */
    async fileExceedsTotalFilesLimit(options = { room_uuid: null, bytes: null }, transaction = null) {
        RoomPermissionServiceValidator.fileExceedsTotalFilesLimit(options);
        const { room_uuid, bytes } = options;
        return await db.RoomView.checkUploadExceedsTotalProcStatic({ bytes, room_uuid }, transaction);
    }

    /**
     * @function fileExceedsSingleFileSize
     * @description Check if adding x number of bytes to a room exceeds the single file size limit.
     * @param {Object} options
     * @param {string} options.room_uuid
     * @param {number} options.bytes
     * @param {Object} options.transaction optional
     * @returns {Promise<boolean>}
     */
    async fileExceedsSingleFileSize(options = { room_uuid: null, bytes: null }, transaction = null) {
        RoomPermissionServiceValidator.fileExceedsSingleFileSize(options);
        const { room_uuid, bytes } = options;
        return await db.RoomView.checkUploadExceedsSingleProcStatic({ bytes, room_uuid }, transaction);
    }

    /**
     * @function roomUserCountExceedsLimit
     * @description Check if adding x number of users to a room exceeds the user limit.
     * @param {Object} options
     * @param {string} options.room_uuid
     * @param {number} options.add_count
     * @param {Object} options.transaction optional
     * @returns {Promise<boolean>}
     */
    async roomUserCountExceedsLimit(options = { room_uuid: null, add_count: null }, transaction = null) {
        RoomPermissionServiceValidator.roomUserCountExceedsLimit(options);
        const { room_uuid, add_count } = options;
        return await db.RoomView.checkUsersExceedsTotalProcStatic({ room_uuid, add_count }, transaction);
    }

    /**
     * @function channelCountExceedsLimit
     * @description Check if adding x number of channels to a room exceeds the channel limit.
     * @param {Object} options
     * @param {string} options.room_uuid
     * @param {number} options.add_count
     * @param {Object} options.transaction optional
     * @returns {Promise<boolean>}
     */
    async channelCountExceedsLimit(options = { room_uuid: null, add_count: null }, transaction = null) {
        RoomPermissionServiceValidator.channelCountExceedsLimit(options);
        const { room_uuid, add_count } = options;
        return await db.RoomView.checkChannelsExceedsTotalProcStatic({ room_uuid, add_count }, transaction);
    }
}

const service = new RoomPermissionService();

export default service;
