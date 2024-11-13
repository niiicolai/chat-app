import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/channel_message_dto.js';
import neodeInstance from '../neode/index.js';
import NeodeBaseFindService from './neode_base_find_service.js';
import { v4 as uuidv4 } from 'uuid';
import { getUploadType } from '../../shared/utils/file_utils.js';
import { broadcastChannel } from '../../../websocket_server.js';

const storage = new StorageService('channel_message_upload');

console.error('TODO: findOne in channel_message_service.js doesn\'t return the upload');

class Service extends NeodeBaseFindService {

    constructor() {
        super('uuid', 'ChannelMessage', dto);
    }

    async findOne(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(400, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');

        const { user, uuid } = options;
        
        const messageInstance = await neodeInstance.model('ChannelMessage').find(uuid);
        if (!messageInstance) throw new ControllerError(404, 'Channel message not found');

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

    async findAll(options = { channel_uuid: null, user: null, page: null, limit: null }) {
        if (!options) throw new ControllerError(400, 'No options provided');
        if (!options.channel_uuid) throw new ControllerError(400, 'No channel_uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');

        const { channel_uuid, user, page, limit } = options;

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return super.findAll({ page, limit, override: {
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
            map: { model: 'cm', relationships: [
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
            ]},
            params: { channel_uuid }
        }}); 
    }

    async create(options = { body: null, file: null, user: null }) {
        if (!options) throw new ControllerError(400, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');
        if (!options.body.uuid) throw new ControllerError(400, 'No body.uuid provided');
        if (!options.body.body) throw new ControllerError(400, 'No body.body provided');
        if (!options.body.channel_uuid) throw new ControllerError(400, 'No body.channel_uuid provided');

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

    async update(options = { uuid: null, body: null, user: null }) {
        if (!options) throw new ControllerError(400, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');

        const { uuid, body, user } = options;
        const { body: msg } = body;
        const { sub: user_uuid } = user;

        const channelMessageInstance = await neodeInstance.model('ChannelMessage').find(uuid);
        if (!channelMessageInstance) throw new ControllerError(404, 'Channel message not found');

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

    async destroy(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(400, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');

        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        const channelMessageInstance = await neodeInstance.model('ChannelMessage').find(uuid);
        if (!channelMessageInstance) throw new ControllerError(404, 'Channel message not found');

        const channel = channelMessageInstance.get('channel').endNode().properties();
        if (!channel) throw new ControllerError(500, 'Channel not found');

        const channelMessageUser = channelMessageInstance.get('user')?.endNode()?.properties();
        const isOwner = channelMessageUser?.uuid === user_uuid;
        const channel_uuid = channel.uuid;

        if (!isOwner &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Moderator' })) &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }))) {
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

        const session = neodeInstance.session();
        session.writeTransaction(async (transaction) => {
            await transaction.run(
                `MATCH (cm:ChannelMessage { uuid: $uuid }) ` +
                `OPTIONAL MATCH (cm)-[:HAS_CHANNEL_MESSAGE_UPLOAD]->(cmu:ChannelMessageUpload)-[:HAS_ROOM_FILE]->(rf:RoomFile) ` +
                `OPTIONAL MATCH (cm)-[:HAS_CHANNEL_WEBHOOK_MESSAGE]->(cwm:ChannelWebhookMessage) ` +
                `DETACH DELETE cm, cmu, rf, cwm`,
                { uuid }
            );

            if (src) {
                const key = storage.parseKey(src);
                await storage.deleteFile(key);
            }
        });

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was deleted.
          */
        broadcastChannel(`channel-${channel_uuid}`, 'chat_message_deleted', { uuid });
    }
}

const service = new Service();

export default service;
