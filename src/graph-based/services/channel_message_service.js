import Validator from '../../shared/validators/channel_message_service_validator.js';
import err from '../../shared/errors/index.js';
import StorageService from '../../shared/services/storage_service.js';
import BroadcastChannelService from '../../shared/services/broadcast_channel_service.js';
import RPS from './room_permission_service.js';
import dto from '../dto/channel_message_dto.js';
import neodeInstance from '../neode/index.js';
import { v4 as uuidv4 } from 'uuid';
import { getUploadType } from '../../shared/utils/file_utils.js';

/**
 * @constant storage
 * @description Storage service instance
 * @type {StorageService}
 */
const storage = new StorageService('channel_message_upload');

/**
 * @class ChannelMessageService
 * @description Service class for channel messages
 * @exports ChannelMessageService
 */
class ChannelMessageService {


    /**
     * @function findOne
     * @description Find a channel message by uuid
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const { user, uuid } = options;

        const messageInstance = await neodeInstance.model('ChannelMessage').find(uuid);
        if (!messageInstance) throw new ControllerError(404, 'channel_message not found');

        const channelMessageType = messageInstance.get('channel_message_type').endNode().properties();
        if (!channelMessageType) throw new ControllerError(404, 'Channel message type not found');

        const channel = messageInstance.get('channel').endNode().properties();
        if (!channel) throw new ControllerError(404, 'Channel not found');

        const channelMessageUpload = messageInstance.get('channel_message_upload')?.endNode()?.properties();
        const _user = messageInstance.get('user')?.endNode()?.properties();

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: channel.uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return dto(messageInstance.properties(), [
            { channelMessageType },
            { channel },
            { channelMessageUpload },
            { user: _user }
        ]);
    }

    /**
     * @function findAll
     * @description Find all channel messages in a channel
     * @param {Object} options
     * @param {string} options.channel_uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { channel_uuid: null, user: null, page: null, limit: null }) {
        options = Validator.findAll(options);

        const { channel_uuid, user, page, limit, offset } = options;

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return super.findAll({
            page, limit, override: {
                match: [
                    'MATCH (cm:ChannelMessage)-[:HAS_CHANNEL]->(c:Channel {uuid: $channel_uuid})',
                    'MATCH (cm)-[:HAS_CHANNEL_MESSAGE_TYPE]->(cmt:ChannelMessageType)',
                    'OPTIONAL MATCH (cm)-[:HAS_USER]->(u:User)',
                    'OPTIONAL MATCH (cm)-[:HAS_CHANNEL_MESSAGE_UPLOAD]->(cmu:ChannelMessageUpload)-[:HAS_ROOM_FILE]->(rf:RoomFile)',
                    'OPTIONAL MATCH (cmu)-[:HAS_CHANNEL_MESSAGE_UPLOAD_TYPE]->(cmmut:ChannelMessageUploadType)',
                    'OPTIONAL MATCH (cm)-[:HAS_CHANNEL_WEBHOOK_MESSAGE]->(cwm:ChannelWebhookMessage)-[:HAS_CHANNEL_WEBHOOK_MESSAGE_TYPE]->(cwm_type:ChannelWebhookMessageType)',
                    'OPTIONAL MATCH (cwm)-[:HAS_CHANNEL_WEBHOOK]->(cw:ChannelWebhook)-[:HAS_CHANNEL_FILE]->(cwrf:RoomFile)',
                ],
                return: ['cm', 'cmt', 'u', 'cmu', 'rf', 'cwm', 'cwm_type', 'cw', 'cwrf', 'cmmut', 'c'],
                map: {
                    model: 'cm', relationships: [
                        { alias: 'cmt', to: 'channelMessageType' },
                        { alias: 'c', to: 'channel' },
                        { alias: 'u', to: 'user' },
                        { alias: 'cmu', to: 'channelMessageUpload' },
                        { alias: 'rf', to: 'roomFile' },
                        { alias: 'cmmut', to: 'channelMessageUploadType' },
                        { alias: 'cwm', to: 'channelWebhookMessage' },
                        { alias: 'cwm_type', to: 'channelWebhookMessageType' },
                        { alias: 'cw', to: 'channelWebhook' },
                        { alias: 'cwrf', to: 'channelWebhookFile' },
                    ]
                },
                params: { channel_uuid }
            }
        });
    }

    /**
     * @function create
     * @description Create a channel message
     * @param {Object} options
     * @param {Object} options.body
     * @param {String} options.body.uuid
     * @param {String} options.body.body
     * @param {String} options.body.channel_uuid
     * @param {Object} options.file optional
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, file: null, user: null }) {
        Validator.create(options);

        const { body, file, user } = options;
        const { uuid, body: msg, channel_uuid } = body;
        const { sub: user_uuid } = user;

        const channelInstance = await neodeInstance.model('Channel').find(channel_uuid);
        if (!channelInstance) throw new ControllerError(404, 'Channel not found');

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const userInstance = await neodeInstance.model('User').find(user_uuid);
        if (!userInstance) throw new ControllerError(404, 'User not found');

        const channelMessageType = await neodeInstance.model('ChannelMessageType').find('User');
        if (!channelMessageType) throw new ControllerError(404, 'Channel message type not found');

        const channelMessage = await neodeInstance.model('ChannelMessage').create({ uuid, body: msg });

        await channelMessage.relateTo(channelInstance, 'channel');
        await channelMessage.relateTo(channelMessageType, 'channel_message_type');
        await channelMessage.relateTo(userInstance, 'user');

        if (file && file.size > 0) {
            const size = file.size;
            const room = channelInstance.get('room').endNode().properties();
            const roomInstance = await neodeInstance.model('Room').find(room.uuid);

            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid: room.uuid, bytes: size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid: room.uuid, bytes: size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }

            const roomFileType = await neodeInstance.model('RoomFileType').find('ChannelMessageUpload');
            if (!roomFileType) throw new ControllerError(404, 'Room file type not found');

            const src = await storage.uploadFile(file, uuid);
            const roomFile = await neodeInstance.model('RoomFile').create({ uuid: uuidv4(), src, size });
            await roomFile.relateTo(roomInstance, 'room');
            await roomFile.relateTo(roomFileType, 'room_file_type');

            const chUploadTypeName = getUploadType(file);
            const chUploadType = await neodeInstance.model('ChannelMessageUploadType').find(chUploadTypeName);
            if (!chUploadType) throw new ControllerError(404, 'Channel message upload type not found');

            const chUpload = await neodeInstance.model('ChannelMessageUpload').create({ uuid: uuidv4() });
            await chUpload.relateTo(chUploadType, 'channel_message_upload_type');
            await chUpload.relateTo(roomFile, 'room_file');

            await channelMessage.relateTo(chUpload, 'channel_message_upload');
        }

        const result = this.findOne({ uuid, user });

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was created.
          */
        broadcastChannel(`channel-${channel_uuid}`, 'chat_message_created', result);

        return result;
    }

    /**
     * @function update
     * @description Update a channel message
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.body
     * @param {string} options.body.body optional
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async update(options = { uuid: null, body: null, user: null }) {
        Validator.update(options);

        const { uuid, body, user } = options;
        const { body: msg } = body;
        const { sub: user_uuid } = user;

        const channelMessageInstance = await neodeInstance.model('ChannelMessage').find(uuid);
        if (!channelMessageInstance) throw new ControllerError(404, 'channel_message not found');

        const channel = channelMessageInstance.get('channel').endNode().properties();
        if (!channel) throw new ControllerError(404, 'Channel not found');

        const channel_uuid = channel.uuid;
        const messageUser = channelMessageInstance.get('user')?.endNode()?.properties();
        const isOwner = messageUser?.uuid === user_uuid;

        if (!isOwner &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Moderator' })) &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an owner of the message, or an admin or moderator of the room');
        }

        if (msg) {
            await channelMessageInstance.update({ body: msg });
        }

        const result = this.findOne({ uuid, user });

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was updated.
          */
        broadcastChannel(`channel-${channel_uuid}`, 'chat_message_updated', result);

        return result;
    }

    /**
     * @function destroy
     * @description Delete a channel message
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null, user: null }) {
        Validator.destroy(options);

        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        const channelMessageInstance = await neodeInstance.model('ChannelMessage').find(uuid);
        if (!channelMessageInstance) throw new ControllerError(404, 'channel_message not found');

        const channel = channelMessageInstance.get('channel').endNode().properties();
        if (!channel) throw new ControllerError(500, 'Channel not found');

        const channelMessageUser = channelMessageInstance.get('user')?.endNode()?.properties();
        const isOwner = channelMessageUser?.uuid === user_uuid;
        const channel_uuid = channel.uuid;
        const [moderator, admin] = await Promise.all([
            RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Moderator' }),
            RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' })
        ]);

        if (!isOwner && !moderator && !admin) {
            throw new ControllerError(403, 'User is not an owner of the message, or an admin or moderator of the room');
        }

        let src = null;
        const channelMessageUpload = channelMessageInstance.get('channel_message_upload')?.endNode()?.properties();
        if (channelMessageUpload) {
            const channelMessageUploadInstance = await neodeInstance.model('ChannelMessageUpload').find(channelMessageUpload.uuid);
            if (!channelMessageUploadInstance) throw new ControllerError(500, 'Channel message upload not found');
            const roomFile = channelMessageUploadInstance.get('room_file').endNode().properties();
            if (!roomFile) throw new ControllerError(500, 'Room file not found');
            src = roomFile.src;
        }

        await channelMessageInstance.delete()
            .then(() => {
                if (src) storage.deleteFile(storage.parseKey(src));

                /**
                 * Broadcast the channel message to all users
                 * in the room where the channel message was deleted.
                 */
                broadcastChannel(`channel-${channel_uuid}`, 'chat_message_deleted', { uuid });
            });
    }

    /**
     * @function createUpload
     * @description Create a channel message upload file (helper function)
     * @param {Object} options
     * @param {String} options.uuid
     * @param {String} options.room_uuid
     * @param {Object} options.file
     * @returns {Promise<String | null>}
     */
    async createUpload(options = { uuid: null, room_uuid: null, file: null }) {
        if (!options) throw new Error('createUpload: options is required');
        if (!options.uuid) throw new Error('createUpload: options.uuid is required');
        if (!options.room_uuid) throw new Error('createUpload: options.room_uuid is required');

        const { uuid, room_uuid, file } = options;

        if (file && file.size > 0) {
            const [singleLimit, totalLimit] = await Promise.all([
                RPS.fileExceedsSingleFileSize({ room_uuid, bytes: file.size }),
                RPS.fileExceedsTotalFilesLimit({ room_uuid, bytes: file.size }),
            ]);

            if (totalLimit) throw new err.ExceedsRoomTotalFilesLimitError();
            if (singleLimit) throw new err.ExceedsSingleFileSizeError();

            return await storage.uploadFile(file, uuid);
        }

        return null;
    }
}

const service = new ChannelMessageService();

export default service;
