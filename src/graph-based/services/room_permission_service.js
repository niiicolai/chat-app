import RoomPermissionServiceValidator from '../../shared/validators/room_permission_service_validator.js';
import neodeInstance from '../neode/index.js';

/**
 * @class RoomPermissionService
 * @description Service class for room permissions
 * @exports RoomPermissionService
 */
class RoomPermissionService {

    /**
     * @function isVerified
     * @description Check if a user is verified
     * @param {Object} options
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Boolean>}
     */
    async isVerified(options = { user: null }) {
        RoomPermissionServiceValidator.isVerified(options);

        const { sub: user_uuid } = options.user;

        return (await neodeInstance.cypher(
              'MATCH (u:User {uuid: $user_uuid})-[:EMAIL_VERIFY_VIA]->(uev:UserEmailVerification)'
            + 'WITH u, uev '
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
     * @returns {Promise<Boolean>}
     */
    async isInRoom(options = { room_uuid: null, user: null, role_name: null }) {
        RoomPermissionServiceValidator.isInRoom(options);

        const { room_uuid, user, role_name } = options;
        const { sub: user_uuid } = user;

        return (await neodeInstance.cypher(
            'MATCH (u:User {uuid: $user_uuid})-[ru:MEMBER_IN]->(r:Room {uuid: $room_uuid}) '
          + 'WITH u, ru, r '
          + (role_name ? 'WHERE ru.role = coalesce($role_name, ru.role) ' : '')
          + 'RETURN r',
            { user_uuid, room_uuid, ...(role_name && { role_name }) }
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
     * @returns {Promise<Boolean>}
     */
    async isInRoomByChannel(options = { channel_uuid: null, user: null, role_name: null }) {
        RoomPermissionServiceValidator.isInRoomByChannel(options);

        const { channel_uuid, user, role_name } = options;
        const { sub: user_uuid } = user;

        return (await neodeInstance.cypher(
            'MATCH (r:Room)-[:COMMUNICATES_IN]->(c:Channel {uuid: $channel_uuid}) '
          + 'MATCH (u:User {uuid: $user_uuid})-[ru:MEMBER_IN]->(r) '
          + 'WITH r, c, u, ru '
          + (role_name ? 'WHERE ru.role = coalesce($role_name, ru.role) ' : '')
          + 'RETURN r',
            { user_uuid, channel_uuid, ...(role_name && { role_name }) }
        )).records.length > 0;
    }

    /**
     * @function fileExceedsTotalFilesLimit
     * @description Check if a file exceeds the total files limit
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Number} options.bytes
     * @returns {Promise<Boolean>}
     */
    async fileExceedsTotalFilesLimit(options = { room_uuid: null, bytes: null }) {
        RoomPermissionServiceValidator.fileExceedsTotalFilesLimit(options);

        const { room_uuid, bytes } = options;

        return (await neodeInstance.cypher(
            'MATCH (r:Room {uuid: $room_uuid}) ' +
            'MATCH (r)-[:FILE_SETTINGS_IS]->(rfs:RoomFileSettings) ' +
            'OPTIONAL MATCH ((rf:RoomFile)-[:STORED_IN]->(r)) ' +
            'WITH r, rfs, rf, sum(rf.size) as totalBytes ' +
            'WHERE totalBytes + $bytes < rfs.total_files_bytes_allowed ' +
            'RETURN r',
            { room_uuid, bytes }
        )).records.length == 0;
    }

    /**
     * @function fileExceedsSingleFileSize
     * @description Check if a file exceeds the single file size limit
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Number} options.bytes
     * @returns {Promise<Boolean>}
     */
    async fileExceedsSingleFileSize(options = { room_uuid: null, bytes: null }) {
        RoomPermissionServiceValidator.fileExceedsSingleFileSize(options);

        const { room_uuid, bytes } = options;

        return (await neodeInstance.cypher(
            'MATCH (r:Room {uuid: $room_uuid}) ' +
            'MATCH (r)-[:FILE_SETTINGS_IS]->(rfs:RoomFileSettings) ' +
            'WITH r, rfs ' +
            'WHERE $bytes < rfs.single_file_bytes_allowed ' +
            'RETURN r',
            { room_uuid, bytes }
        )).records.length == 0;
    }

    /**
     * @function roomUserCountExceedsLimit
     * @description Check if a room user count exceeds the limit
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Number} options.add_count
     * @returns {Promise<Boolean>}
     */
    async roomUserCountExceedsLimit(options = { room_uuid: null, add_count: null }) {
        RoomPermissionServiceValidator.roomUserCountExceedsLimit(options);

        const { room_uuid, add_count } = options;

        return (await neodeInstance.cypher(
            'MATCH (r:Room {uuid: $room_uuid}) '
          + 'MATCH (r)-[:USER_SETTINGS_IS]->(rus:RoomUserSettings) '
          + 'MATCH (u:User)-[:MEMBER_IN]->(r) '
          + 'WITH r, rus, u, count(u) as totalUsers '
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
     * @returns {Promise<Boolean>}
     */
    async channelCountExceedsLimit(options = { room_uuid: null, add_count: null }) {
        RoomPermissionServiceValidator.channelCountExceedsLimit(options);

        const { room_uuid, add_count } = options;

        return (await neodeInstance.cypher(
            'MATCH (r:Room {uuid: $room_uuid}) '
          + 'MATCH (r)-[:CHANNEL_SETTINGS_IS]->(rcs:RoomChannelSettings) '
          + 'MATCH (r)-[:COMMUNICATES_IN]->(c:Channel) '
          + 'WITH r, rcs, c, count(c) as totalChannels '
          + 'WHERE totalChannels + $add_count > rcs.max_channels '
          + 'RETURN r',
            { room_uuid, add_count }
        )).records.length > 0;
    }
}

const service = new RoomPermissionService();

export default service;
