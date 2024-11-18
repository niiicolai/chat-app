import ControllerError from '../../shared/errors/controller_error.js';
import User from '../mongoose/models/user.js';
import Room from '../mongoose/models/room.js';
import RoomUser from '../mongoose/models/room_user.js';
import Channel from '../mongoose/models/channel.js';
import RoomFile from '../mongoose/models/room_file.js';

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
        if (!options) throw new ControllerError(500, 'isInRoom: No options provided');
        if (!options.room_uuid) throw new ControllerError(500, 'isInRoom: No room_uuid provided');
        if (!options.user) throw new ControllerError(500, 'isInRoom: No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'isInRoom: No user.sub provided');

        const { room_uuid, user } = options;
        const { sub: user_uuid } = user;

        const savedRoom = await Room.findOne({ uuid: room_uuid }).populate('room_users.user room_users.room_user_role');
        if (!savedRoom) throw new ControllerError(404, 'Room not found');

        const roomUser = savedRoom.room_users.find(u => u.user.uuid === user_uuid);
        if (!roomUser) return false;

        if (options.role_name && roomUser.room_user_role.name !== options.role_name) {
            return false;
        }

        return true;
    }

    async isInRoomByChannel(options = { channel_uuid: null, user: null, role_name: null }) {
        if (!options) throw new ControllerError(500, 'isInRoomByChannel: No options provided');
        if (!options.channel_uuid) throw new ControllerError(500, 'isInRoomByChannel: No channel_uuid provided');
        if (!options.user) throw new ControllerError(500, 'isInRoomByChannel: No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'isInRoomByChannel: No user.sub provided');

        const { channel_uuid, user } = options;
        const { sub: user_uuid } = user;
        
        const ch = await Channel.findOne({ uuid: channel_uuid }).populate('room');
        if (!ch) throw new ControllerError(404, 'Channel not found');

        const room = await Room.findOne({ uuid: ch.room.uuid }).populate('room_users.user room_users.room_user_role');
        const roomUser = room?.room_users?.find(u => u.user.uuid === user_uuid);

        if(!roomUser) return false;

        if (options.role_name && roomUser.room_user_role.name !== options.role_name) {
            return false;
        }

        return true;
    }

    async fileExceedsTotalFilesLimit(options = { room_uuid: null, bytes: null }) {
        const { room_uuid, bytes } = options;

        if (!room_uuid) {
            throw new ControllerError(500, 'fileExceedsTotalFilesLimit: No room_uuid provided');
        }
        if (!bytes) {
            throw new ControllerError(500, 'fileExceedsTotalFilesLimit: No bytes provided');
        }
       
        const room = await Room.findOne({ uuid: room_uuid });
        if (!room) throw new ControllerError(404, 'Room not found');

        const { total_files_bytes_allowed } = room.room_file_settings;
        const roomFiles = await RoomFile.find({ room: room._id });
        const totalBytes = roomFiles.reduce((acc, file) => acc + file.size, 0);

        return (totalBytes + bytes) > total_files_bytes_allowed;
    }

    async fileExceedsSingleFileSize(options = { room_uuid: null, bytes: null }) {
        const { room_uuid, bytes } = options;

        if (!room_uuid) {
            throw new ControllerError(500, 'fileExceedsSingleFileSize: No room_uuid provided');
        }
        if (!bytes) {
            throw new ControllerError(500, 'fileExceedsSingleFileSize: No bytes provided');
        }

        const room = await Room.findOne({ uuid: room_uuid });
        if (!room) throw new ControllerError(404, 'Room not found');

        return bytes > room.room_file_settings.single_file_bytes_allowed;
    }

    async roomUserCountExceedsLimit(options = { room_uuid: null, add_count: null }) {
        const { room_uuid, add_count } = options;

        if (!room_uuid) {
            throw new ControllerError(500, 'roomUserCountExceedsLimit: No room_uuid provided');
        }
        if (!add_count) {
            throw new ControllerError(500, 'roomUserCountExceedsLimit: No add_count provided');
        }

        const room = await Room.findOne({ uuid: room_uuid });
        if (!room) throw new ControllerError(404, 'Room not found');

        return (room.room_users.length + add_count) > room.room_user_settings.max_users;
    }

    async channelCountExceedsLimit(options = { room_uuid: null, add_count: null }) {
        const { room_uuid, add_count } = options;

        if (!room_uuid) {
            throw new ControllerError(500, 'channelCountExceedsLimit: No room_uuid provided');
        }
        if (!add_count) {
            throw new ControllerError(500, 'channelCountExceedsLimit: No add_count provided');
        }

        const room = await Room.findOne({ uuid: room_uuid });
        if (!room) throw new ControllerError(404, 'Room not found');

        const roomChannels = await Channel.countDocuments({ room: room._id });

        return (roomChannels + add_count) > room.room_channel_settings.max_channels;
    }
}

const service = new RoomPermissionService();

export default service;
