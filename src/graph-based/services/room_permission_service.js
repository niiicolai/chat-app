import ControllerError from '../../shared/errors/controller_error.js';
import neodeInstance from '../neode/index.js';

class RoomPermissionService {

    async isVerified(options = { user: null }) {
        if (!options) throw new ControllerError(500, 'isVerified: No options provided');
        if (!options.user) throw new ControllerError(500, 'isVerified: No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'isVerified: No user.sub provided');

        const { user } = options;
        const { sub: user_uuid } = user;

        const existsInstance = await neodeInstance.model('User').find(user_uuid);
        if (!existsInstance) throw new ControllerError(404, 'User not found');

        return existsInstance
            .get('user_email_verification')
            .endNode()
            .properties()
            .is_verified === true;
    }

    async isInRoom(options = { room_uuid: null, user: null, role_name: null }) {
        if (!options) throw new ControllerError(500, 'isInRoom: No options provided');
        if (!options.room_uuid) throw new ControllerError(500, 'isInRoom: No options.room_uuid provided');
        if (!options.user) throw new ControllerError(500, 'isInRoom: No options.user provided');
        if (!options.user.sub) throw new ControllerError(500, 'isInRoom: No options.user.sub provided');

        const { room_uuid, user } = options;
        const { sub: user_uuid } = user;

        const roomInstance = await neodeInstance.model('Room').find(room_uuid);
        if (!roomInstance) throw new ControllerError(404, 'Room not found');

        const userInstance = await neodeInstance.model('User').find(user_uuid);
        if (!userInstance) throw new ControllerError(404, 'User not found');

        const roomUserInstance = await neodeInstance.cypher(
            `MATCH (ru:RoomUser)-[:HAS_USER]->(u:User {uuid: $user_uuid})
             MATCH (ru)-[:HAS_ROLE]->(rur:RoomUserRole)
             MATCH (ru)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid})
             RETURN ru, rur`,
            { user_uuid, room_uuid }
        );
     
        if (!roomUserInstance.records.length) return false;

        const role = roomUserInstance.records[0].get('rur').properties.name;
        
        if (options.role_name && role !== options.role_name) return false;

        return true;
    }

    async isInRoomByChannel(options = { channel_uuid: null, user: null, role_name: null }) {
        if (!options) throw new ControllerError(500, 'isInRoomByChannel: No options provided');
        if (!options.channel_uuid) throw new ControllerError(500, 'isInRoomByChannel: No options.channel_uuid provided');
        if (!options.user) throw new ControllerError(500, 'isInRoomByChannel: No options.user provided');
        if (!options.user.sub) throw new ControllerError(500, 'isInRoomByChannel: No options.user.sub provided');

        const { channel_uuid, user } = options;
        const { sub: user_uuid } = user;

        const userInstance = await neodeInstance.model('User').find(user_uuid);
        if (!userInstance) throw new ControllerError(404, 'User not found');

        const channelInstance = await neodeInstance.model('Channel').find(channel_uuid);
        if (!channelInstance) throw new ControllerError(404, 'Channel not found');

        const roomInstance = channelInstance.get('room').endNode();
        const room_uuid = roomInstance.properties().uuid;

        const roomUserInstance = await neodeInstance.cypher(
            'MATCH (u:User {uuid: $user_uuid})-[r:IN_ROOM]->(room:Room {uuid: $room_uuid}) RETURN r',
            { user_uuid, room_uuid }
        )
        if (!roomUserInstance) return false;

        const roleInstance = await roomUserInstance.get('room_user_role').endNode();
        const role = roleInstance.properties().name;
        if (options.role_name && role !== options.role_name) return false;

        return true;
    }

    async fileExceedsTotalFilesLimit(options = { room_uuid: null, bytes: null }) {
        if (!options) throw new ControllerError(500, 'fileExceedsTotalFilesLimit: No options provided');
        if (!options.room_uuid) throw new ControllerError(500, 'fileExceedsTotalFilesLimit: No options.room_uuid provided');
        if (!options.bytes) throw new ControllerError(500, 'fileExceedsTotalFilesLimit: No options.bytes provided');

        const { room_uuid, bytes } = options;

        const roomInstance = await neodeInstance.model('Room').find(room_uuid);
        if (!roomInstance) throw new ControllerError(404, 'Room not found');

        const roomFileSettingsInstance = await roomInstance.get('room_file_settings').endNode();
        const total_files_bytes_allowed = roomFileSettingsInstance.properties().total_files_bytes_allowed;
  
        const roomFiles = await roomInstance.relationships('HAS_ROOM_FILE');
        const totalBytes = roomFiles.reduce((acc, file) => acc + file.properties().size, 0);
        const exceeds = totalBytes + bytes > total_files_bytes_allowed;

        return exceeds;
    }

    async fileExceedsSingleFileSize(options = { room_uuid: null, bytes: null }) {
        if (!options) throw new ControllerError(500, 'fileExceedsSingleFileSize: No options provided');
        if (!options.room_uuid) throw new ControllerError(500, 'fileExceedsSingleFileSize: No options.room_uuid provided');
        if (!options.bytes) throw new ControllerError(500, 'fileExceedsSingleFileSize: No options.bytes provided');

        const { room_uuid, bytes } = options;

        const roomInstance = await neodeInstance.model('Room').find(room_uuid);
        if (!roomInstance) throw new ControllerError(404, 'Room not found');

        const roomFileSettingsInstance = await roomInstance.get('room_file_settings').endNode();
        const single_file_bytes_allowed = roomFileSettingsInstance.properties().single_file_bytes_allowed;

        const exceeds = bytes > single_file_bytes_allowed;

        return exceeds;
    }

    async roomUserCountExceedsLimit(options = { room_uuid: null, add_count: null }) {
        if (!options) throw new ControllerError(500, 'roomUserCountExceedsLimit: No options provided');
        if (!options.room_uuid) throw new ControllerError(500, 'roomUserCountExceedsLimit: No options.room_uuid provided');
        if (!options.add_count) throw new ControllerError(500, 'roomUserCountExceedsLimit: No options.add_count provided');

        const { room_uuid, add_count } = options;

        const roomInstance = await neodeInstance.model('Room').find(room_uuid);
        if (!roomInstance) throw new ControllerError(404, 'Room not found');

        const roomUserSettingsInstance = await roomInstance.get('room_user_settings').endNode();
        const max_users = roomUserSettingsInstance.properties().max_users;

        const roomUsers = await roomInstance.relationships('HAS_ROOM_USER');
        const exceeds = roomUsers.length + add_count > max_users;

        return exceeds;
    }

    async channelCountExceedsLimit(options = { room_uuid: null, add_count: null }) {
        if (!options) throw new ControllerError(500, 'channelCountExceedsLimit: No options provided');
        if (!options.room_uuid) throw new ControllerError(500, 'channelCountExceedsLimit: No options.room_uuid provided');
        if (!options.add_count) throw new ControllerError(500, 'channelCountExceedsLimit: No options.add_count provided');

        const { room_uuid, add_count } = options;

        const roomInstance = await neodeInstance.model('Room').find(room_uuid);
        if (!roomInstance) throw new ControllerError(404, 'Room not found');

        const roomChannelSettingsInstance = await roomInstance.get('room_channel_settings').endNode();
        const max_channels = roomChannelSettingsInstance.properties().max_channels;

        const roomChannels = await roomInstance.relationships('HAS_CHANNEL');
        const exceeds = roomChannels.length + add_count > max_channels;

        return exceeds;
    }
}

const service = new RoomPermissionService();

export default service;
