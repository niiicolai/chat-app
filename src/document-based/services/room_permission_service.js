import Validator from '../../shared/validators/room_permission_service_validator.js';
import User from '../mongoose/models/user.js';
import Room from '../mongoose/models/room.js';
import Channel from '../mongoose/models/channel.js';
import RoomFile from '../mongoose/models/room_file.js';

class RoomPermissionService {

    /**
     * @function isVerified
     * @description Check if user's email is verified
     * @param {Object} options
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {Object} transaction optional
     * @returns {Promise<Boolean>}
     */
    async isVerified(options = { user: null }, transaction = null) {
        Validator.isVerified(options);
        return await User
            .findOne({ _id: options.user.sub })
            .populate('user_email_verification')
            .session(transaction)
            .then(user => user?.user_email_verification?.is_verified === true);
    }

    /**
     * @function isInRoom
     * @description Check if user is in room
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {String} options.role_name
     * @param {Object} transaction optional
     * @returns {Promise<Boolean>}
     */
    async isInRoom(options = { room_uuid: null, user: null, role_name: null }, transaction = null) {
        Validator.isInRoom(options);
        return await Room.findOne({ _id: options.room_uuid })
            .populate('room_users.user room_users.room_user_role')
            .session(transaction)
            .then(room => {
                const roomUser = room?.room_users?.find(u => u.user._id === options.user.sub);
                if (!roomUser) return false;
                return !options.role_name || roomUser.room_user_role._id === options.role_name;
            });
    }

    /**
     * @function isInRoomByChannel
     * @description Check if user is in room by channel
     * @param {Object} options
     * @param {String} options.channel_uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {String} options.role_name
     * @param {Object} transaction optional
     * @returns {Promise<Boolean>}
     */
    async isInRoomByChannel(options = { channel_uuid: null, user: null, role_name: null }, transaction = null) {
        Validator.isInRoomByChannel(options);
        return await Channel.findOne({ _id: options.channel_uuid })
            .populate('room')
            .session(transaction)
            .then(channel => this.isInRoom({ 
                room_uuid: channel.room._id, 
                user: options.user, 
                role_name: options.role_name 
            }, transaction));
    }

    /**
     * @function fileExceedsTotalFilesLimit
     * @description Check if file exceeds total files limit
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Number} options.bytes
     * @param {Object} transaction optional
     * @returns {Promise<Boolean>}
     */
    async fileExceedsTotalFilesLimit(options = { room_uuid: null, bytes: null }, transaction = null) {
        Validator.fileExceedsTotalFilesLimit(options);
        return await Room
            .findOne({ _id: options.room_uuid })
            .session(transaction)
            .then(room => room.room_file_settings.total_files_bytes_allowed)
            .then(total_files_bytes_allowed => RoomFile
                .find({ room: options.room_uuid })
                .session(transaction)
                .then(roomFiles => roomFiles.reduce((acc, file) => acc + file.size, 0))
                .then(totalBytes => (totalBytes + options.bytes) > total_files_bytes_allowed));
    }

    /**
     * @function fileExceedsSingleFileSize
     * @description Check if file exceeds single file size
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Number} options.bytes
     * @param {Object} transaction optional
     * @returns {Promise<Boolean>}
     */
    async fileExceedsSingleFileSize(options = { room_uuid: null, bytes: null }, transaction = null) {
        Validator.fileExceedsSingleFileSize(options);
        return await Room
            .findOne({ _id: options.room_uuid })
            .session(transaction)
            .then(room => options.bytes > room.room_file_settings.single_file_bytes_allowed);
    }

    /**
     * @function roomUserCountExceedsLimit
     * @description Check if room user count exceeds limit
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Number} options.add_count
     * @param {Object} transaction optional
     * @returns {Promise<Boolean>}
     */
    async roomUserCountExceedsLimit(options = { room_uuid: null, add_count: null }, transaction = null) {
        Validator.roomUserCountExceedsLimit(options);
        return await Room
            .findOne({ _id: options.room_uuid })
            .session(transaction)
            .then(room => (room.room_users.length + options.add_count) > room.room_user_settings.max_users);
    }

    /**
     * @function channelCountExceedsLimit
     * @description Check if channel count exceeds limit
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Number} options.add_count
     * @param {Object} transaction optional
     * @returns {Promise<Boolean>}
     */
    async channelCountExceedsLimit(options = { room_uuid: null, add_count: null }, transaction = null) {
        Validator.channelCountExceedsLimit(options);
        return await Room
            .findOne({ _id: options.room_uuid })
            .session(transaction)
            .then(room => room.room_channel_settings.max_channels)
            .then(max_channels => Channel
                .countDocuments({ room: options.room_uuid })
                .session(transaction)
                .then(roomChannels => (roomChannels + options.add_count) > max_channels));
    }
}

const service = new RoomPermissionService();

export default service;
