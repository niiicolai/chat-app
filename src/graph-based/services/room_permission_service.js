import ControllerError from '../../shared/errors/controller_error.js';
import neodeInstance from '../neode/index.js';

class RoomPermissionService {

    /**
     * @function isVerified
     * @description Check if a user is verified
     * @param {Object} options
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Boolean}
     */
    async isVerified(options = { user: null }) {
        if (!options) throw new ControllerError(500, 'isVerified: No options provided');
        if (!options.user) throw new ControllerError(500, 'isVerified: No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'isVerified: No user.sub provided');

        const { sub: user_uuid } = options.user;

        return (await neodeInstance.cypher(
              'MATCH (u:User {uuid: $user_uuid})-[:HAS_USER_EMAIL_VERIFICATION]->(uev:UserEmailVerification)'
            + 'WHERE uev.is_verified = true '
            + 'RETURN uev',
            { user_uuid }
        )).records.length > 0;
    }

    /**
     * @function isInRoom
     * @description Check if a user is in a room
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {String} options.role_name
     * @returns {Boolean}
     */
    async isInRoom(options = { room_uuid: null, user: null, role_name: null }) {
        if (!options) throw new ControllerError(500, 'isInRoom: No options provided');
        if (!options.room_uuid) throw new ControllerError(500, 'isInRoom: No options.room_uuid provided');
        if (!options.user) throw new ControllerError(500, 'isInRoom: No options.user provided');
        if (!options.user.sub) throw new ControllerError(500, 'isInRoom: No options.user.sub provided');

        const { room_uuid, user, role_name } = options;
        const { sub: user_uuid } = user;

        return (await neodeInstance.cypher(
            'MATCH (ru:RoomUser)-[:HAS_USER]->(u:User {uuid: $user_uuid}) '
          + 'MATCH (ru)-[:HAS_ROLE]->(rur:RoomUserRole) '
          + 'MATCH (ru)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid}) '
          + 'WHERE rur.name = coalesce($role_name, rur.name) '
          + 'RETURN ru',
            { user_uuid, room_uuid, role_name }
        )).records.length > 0;
    }

    /**
     * @function isInRoomByChannel
     * @description Check if a user is in a room by channel
     * @param {Object} options
     * @param {String} options.channel_uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {String} options.role_name
     * @returns {Boolean}
     */
    async isInRoomByChannel(options = { channel_uuid: null, user: null, role_name: null }) {
        if (!options) throw new ControllerError(500, 'isInRoomByChannel: No options provided');
        if (!options.channel_uuid) throw new ControllerError(500, 'isInRoomByChannel: No options.channel_uuid provided');
        if (!options.user) throw new ControllerError(500, 'isInRoomByChannel: No options.user provided');
        if (!options.user.sub) throw new ControllerError(500, 'isInRoomByChannel: No options.user.sub provided');

        const { channel_uuid, user, role_name } = options;
        const { sub: user_uuid } = user;

        return (await neodeInstance.cypher(
            'MATCH (c:Channel {uuid: $channel_uuid})-[:HAS_ROOM]->(r:Room) '
          + 'MATCH (ru:RoomUser)-[:HAS_USER]->(u:User {uuid: $user_uuid}) '
          + 'MATCH (ru)-[:HAS_ROOM]->(r) '
          + 'MATCH (ru)-[:HAS_ROLE]->(rur:RoomUserRole) '
          + 'WHERE rur.name = coalesce($role_name, rur.name) '
          + 'RETURN ru',
            { user_uuid, channel_uuid, role_name }
        )).records.length > 0;
    }

    /**
     * @function fileExceedsTotalFilesLimit
     * @description Check if a file exceeds the total files limit
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Number} options.bytes
     * @returns {Boolean}
     */
    async fileExceedsTotalFilesLimit(options = { room_uuid: null, bytes: null }) {
        if (!options) throw new ControllerError(500, 'fileExceedsTotalFilesLimit: No options provided');
        if (!options.room_uuid) throw new ControllerError(500, 'fileExceedsTotalFilesLimit: No options.room_uuid provided');
        if (!options.bytes) throw new ControllerError(500, 'fileExceedsTotalFilesLimit: No options.bytes provided');

        const { room_uuid, bytes } = options;

        return (await neodeInstance.cypher(
            'MATCH (r:Room {uuid: $room_uuid})-[:HAS_ROOM_FILE]->(rf:RoomFile)'
          + 'MATCH (r)-[:HAS_ROOM_FILE_SETTINGS]->(rfs:RoomFileSettings)'
          + 'WITH r, rfs, rf, sum(rf.size) as totalBytes '
          + 'WHERE totalBytes + $bytes > rfs.total_files_bytes_allowed '
          + 'RETURN r',
            { room_uuid, bytes }
        )).records.length > 0;
    }

    /**
     * @function fileExceedsSingleFileSize
     * @description Check if a file exceeds the single file size limit
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Number} options.bytes
     * @returns {Boolean}
     */
    async fileExceedsSingleFileSize(options = { room_uuid: null, bytes: null }) {
        if (!options) throw new ControllerError(500, 'fileExceedsSingleFileSize: No options provided');
        if (!options.room_uuid) throw new ControllerError(500, 'fileExceedsSingleFileSize: No options.room_uuid provided');
        if (!options.bytes) throw new ControllerError(500, 'fileExceedsSingleFileSize: No options.bytes provided');

        const { room_uuid, bytes } = options;

        return (await neodeInstance.cypher(
            'MATCH (r:Room {uuid: $room_uuid})-[:HAS_ROOM_FILE_SETTINGS]->(rfs:RoomFileSettings) '
          + 'WHERE $bytes > rfs.single_file_bytes_allowed '
          + 'RETURN r',
            { room_uuid, bytes }
        )).records.length > 0;
    }

    /**
     * @function roomUserCountExceedsLimit
     * @description Check if a room user count exceeds the limit
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Number} options.add_count
     * @returns {Boolean}
     */
    async roomUserCountExceedsLimit(options = { room_uuid: null, add_count: null }) {
        if (!options) throw new ControllerError(500, 'roomUserCountExceedsLimit: No options provided');
        if (!options.room_uuid) throw new ControllerError(500, 'roomUserCountExceedsLimit: No options.room_uuid provided');
        if (!options.add_count) throw new ControllerError(500, 'roomUserCountExceedsLimit: No options.add_count provided');

        const { room_uuid, add_count } = options;

        return (await neodeInstance.cypher(
            'MATCH (r:Room {uuid: $room_uuid}) '
          + 'MATCH (r)-[:HAS_ROOM_USER_SETTINGS]->(rus:RoomUserSettings) '
          + 'MATCH (ru:RoomUser)-[:HAS_ROOM]->(r) '
          + 'WITH r, rus, ru, count(ru) as totalUsers '
          + 'WHERE totalUsers + $add_count > rus.max_users '
          + 'RETURN r',
            { room_uuid, add_count }
        )).records.length > 0;
    }

    /**
     * @function channelCountExceedsLimit
     * @description Check if a channel count exceeds the limit
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Number} options.add_count
     * @returns {Boolean}
     */
    async channelCountExceedsLimit(options = { room_uuid: null, add_count: null }) {
        if (!options) throw new ControllerError(500, 'channelCountExceedsLimit: No options provided');
        if (!options.room_uuid) throw new ControllerError(500, 'channelCountExceedsLimit: No options.room_uuid provided');
        if (!options.add_count) throw new ControllerError(500, 'channelCountExceedsLimit: No options.add_count provided');

        const { room_uuid, add_count } = options;

        return (await neodeInstance.cypher(
            'MATCH (r:Room {uuid: $room_uuid}) '
          + 'MATCH (r)-[:HAS_ROOM_CHANNEL_SETTINGS]->(rcs:RoomChannelSettings) '
          + 'MATCH (c:Channel)-[:HAS_ROOM]->(r) '
          + 'WITH r, rcs, c, count(c) as totalChannels '
          + 'WHERE totalChannels + $add_count > rcs.max_channels '
          + 'RETURN r',
            { room_uuid, add_count }
        )).records.length > 0;
    }
}

const service = new RoomPermissionService();

export default service;
