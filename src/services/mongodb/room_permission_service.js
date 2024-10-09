import ControllerError from '../../errors/controller_error.js';
import User from '../../../mongoose/models/user.js';
import Room from '../../../mongoose/models/room.js';
import RoomUser from '../../../mongoose/models/room_user.js';
import Channel from '../../../mongoose/models/channel.js';
import RoomFile from '../../../mongoose/models/room_file.js';

class RoomPermissionService {

    async isVerified(options = { user: null }) {
        const { user } = options;
        const { sub: user_uuid } = user;

        if (!user_uuid) {
            throw new ControllerError(400, 'isVerified: No user_uuid provided');
        }

        const exists = await User.findOne({ uuid: user_uuid }).populate('user_email_verification');

        return exists && exists.user_email_verification.is_verified;
    }

    async isInRoom(options = { room_uuid: null, user: null, role_name: null }) {
        const { room_uuid, user } = options;
        const { sub: user_uuid } = user;

        if (!room_uuid) {
            throw new ControllerError(400, 'isInRoom: No room_uuid provided');
        }
        if (!user_uuid) {
            throw new ControllerError(400, 'isInRoom: No user_uuid provided');
        }

        const savedRoom = await Room.findOne({ uuid: room_uuid });
        if (!savedRoom) {
            throw new ControllerError(404, 'Room not found');
        }

        const savedUser = await User.findOne({ uuid: user_uuid });
        if (!savedUser) {
            throw new ControllerError(404, 'User not found');
        }

        const exists = await RoomUser.findOne({ room: savedRoom._id, user: savedUser._id }).populate('room_user_role');

        if (!exists) return false;

        if (options.role_name && exists.room_user_role.name !== options.role_name) {
            return false;
        }
        return true;
    }

    async isInRoomByChannel(options = { channel_uuid: null, user: null, role_name: null }) {
        const { channel_uuid, user } = options;
        const { sub: user_uuid } = user;

        if (!channel_uuid) {
            throw new ControllerError(400, 'isInRoomByChannel: No channel_uuid provided');
        }
        if (!user_uuid) {
            throw new ControllerError(400, 'isInRoomByChannel: No user_uuid provided');
        }

        const ch = await Channel.findOne({ uuid: channel_uuid });
        const exists = await RoomUser.findOne({ room_uuid: ch.room_uuid, user_uuid }).populate('room_user_role');
        if(!exists) return false;

        if (options.role_name && exists.room_user_role.name !== options.role_name) {
            return false;
        }
        return true;
    }

    async fileExceedsTotalFilesLimit(options = { room_uuid: null, bytes: null }) {
        const { room_uuid, bytes } = options;

        if (!room_uuid) {
            throw new ControllerError(400, 'fileExceedsTotalFilesLimit: No room_uuid provided');
        }
        if (!bytes) {
            throw new ControllerError(400, 'fileExceedsTotalFilesLimit: No bytes provided');
        }
       
        const room = await Room.findOne({ uuid: room_uuid })
            .populate('room_file_settings');
        if (!room) {
            throw new ControllerError(404, 'Room not found');
        }

        const { total_files_bytes_allowed } = room.room_file_settings;
        const roomFiles = await RoomFile.find({ room_uuid });
        const totalBytes = roomFiles.reduce((acc, file) => acc + file.size, 0);
        const exceeds = totalBytes + bytes > total_files_bytes_allowed;

        return exceeds;
    }

    async fileExceedsSingleFileSize(options = { room_uuid: null, bytes: null }) {
        const { room_uuid, bytes } = options;

        if (!room_uuid) {
            throw new ControllerError(400, 'fileExceedsSingleFileSize: No room_uuid provided');
        }
        if (!bytes) {
            throw new ControllerError(400, 'fileExceedsSingleFileSize: No bytes provided');
        }

        const room = await Room.findOne({ uuid: room_uuid })
            .populate('room_file_settings');
        if (!room) {
            throw new ControllerError(404, 'Room not found');
        }

        const { single_file_bytes_allowed } = room.room_file_settings;
        const exceeds = bytes > single_file_bytes_allowed;

        return exceeds;
    }

    async roomUserCountExceedsLimit(options = { room_uuid: null, add_count: null }) {
        const { room_uuid, add_count } = options;

        if (!room_uuid) {
            throw new ControllerError(400, 'roomUserCountExceedsLimit: No room_uuid provided');
        }
        if (!add_count) {
            throw new ControllerError(400, 'roomUserCountExceedsLimit: No add_count provided');
        }

        const room = await Room.findOne({ uuid: room_uuid })
            .populate('room_user_settings');
        if (!room) {
            throw new ControllerError(404, 'Room not found');
        }

        const { max_users } = room.room_user_settings;
        const roomUsers = await RoomUser.countDocuments({ room_uuid });
        const exceeds = roomUsers + add_count > max_users;

        return exceeds;
    }

    async channelCountExceedsLimit(options = { room_uuid: null, add_count: null }) {
        const { room_uuid, add_count } = options;

        if (!room_uuid) {
            throw new ControllerError(400, 'channelCountExceedsLimit: No room_uuid provided');
        }
        if (!add_count) {
            throw new ControllerError(400, 'channelCountExceedsLimit: No add_count provided');
        }

        const room = await Room.findOne({ uuid: room_uuid })
            .populate('room_channel_settings');
        if (!room) {
            throw new ControllerError(404, 'Room not found');
        }

        const { max_channels } = room.room_channel_settings;
        const roomChannels = await Channel.countDocuments({ room_uuid });
        const exceeds = roomChannels + add_count > max_channels;

        return exceeds;
    }
}

const service = new RoomPermissionService();

export default service;
