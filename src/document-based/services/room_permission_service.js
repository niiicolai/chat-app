import RoomPermissionServiceValidator from '../../shared/validators/room_permission_service_validator.js';
import User from '../mongoose/models/user.js';
import Room from '../mongoose/models/room.js';
import Channel from '../mongoose/models/channel.js';
import RoomFile from '../mongoose/models/room_file.js';

class RoomPermissionService {

    async isVerified(options = { user: null }) {
        RoomPermissionServiceValidator.isVerified(options);

        const { user } = options;
        const { sub: user_uuid } = user;
        const exists = await User.findOne({ uuid: user_uuid }).populate('user_email_verification');
        
        return exists && exists.user_email_verification.is_verified;
    }

    async isInRoom(options = { room_uuid: null, user: null, role_name: null }) {
        RoomPermissionServiceValidator.isInRoom(options);

        const { room_uuid, user } = options;
        const { sub: user_uuid } = user;

        const savedRoom = await Room.findOne({ uuid: room_uuid }).populate('room_users.user room_users.room_user_role');
        const roomUser = savedRoom?.room_users?.find(u => u.user.uuid === user_uuid);
        
        if (!roomUser) return false;

        if (options.role_name && roomUser.room_user_role.name !== options.role_name) {
            return false;
        }

        return true;
    }

    async isInRoomByChannel(options = { channel_uuid: null, user: null, role_name: null }) {
        RoomPermissionServiceValidator.isInRoomByChannel(options);

        const { channel_uuid, user } = options;
        const { sub: user_uuid } = user;
        
        const ch = await Channel.findOne({ uuid: channel_uuid }).populate('room');
        if (!ch) return false;

        const room = await Room.findOne({ uuid: ch.room.uuid }).populate('room_users.user room_users.room_user_role');
        const roomUser = room?.room_users?.find(u => u.user.uuid === user_uuid);

        if(!roomUser) return false;

        if (options.role_name && roomUser.room_user_role.name !== options.role_name) {
            return false;
        }

        return true;
    }

    async fileExceedsTotalFilesLimit(options = { room_uuid: null, bytes: null }) {
        RoomPermissionServiceValidator.fileExceedsTotalFilesLimit(options);

        const { room_uuid, bytes } = options;
       
        const room = await Room.findOne({ uuid: room_uuid });
        if (!room) return false;

        const { total_files_bytes_allowed } = room.room_file_settings;
        const roomFiles = await RoomFile.find({ room: room._id });
        const totalBytes = roomFiles.reduce((acc, file) => acc + file.size, 0);

        return (totalBytes + bytes) > total_files_bytes_allowed;
    }

    async fileExceedsSingleFileSize(options = { room_uuid: null, bytes: null }) {
        RoomPermissionServiceValidator.fileExceedsSingleFileSize(options);

        const { room_uuid, bytes } = options;
        const room = await Room.findOne({ uuid: room_uuid });
        if (!room) return false;

        return bytes > room.room_file_settings.single_file_bytes_allowed;
    }

    async roomUserCountExceedsLimit(options = { room_uuid: null, add_count: null }) {
        RoomPermissionServiceValidator.roomUserCountExceedsLimit(options);

        const { room_uuid, add_count } = options;
        const room = await Room.findOne({ uuid: room_uuid });
        if (!room) return false;

        return (room.room_users.length + add_count) > room.room_user_settings.max_users;
    }

    async channelCountExceedsLimit(options = { room_uuid: null, add_count: null }) {
        RoomPermissionServiceValidator.channelCountExceedsLimit(options);

        const { room_uuid, add_count } = options;
        const room = await Room.findOne({ uuid: room_uuid });
        if (!room) return false;

        const roomChannels = await Channel.countDocuments({ room: room._id });
        return (roomChannels + add_count) > room.room_channel_settings.max_channels;
    }
}

const service = new RoomPermissionService();

export default service;
