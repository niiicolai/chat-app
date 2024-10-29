import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/channel_webhook_dto.js';
import neodeInstance from '../neode/index.js';
import neo4j from 'neo4j-driver';
import { broadcastChannel } from '../../../websocket_server.js';
import { v4 as uuidv4 } from 'uuid';

const storage = new StorageService('channel_avatar');

class Service {

    async findOne(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');

        const { user, uuid } = options;

        const webhookInstance = await neodeInstance.model('ChannelWebhook').find(uuid);
        if (!webhookInstance) throw new ControllerError(404, 'Channel Webhook not found');

        const channel = webhookInstance.get('channel').endNode().properties();
        if (!channel) throw new ControllerError(404, 'Channel not found');

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: channel.uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const roomFile = webhookInstance.get('room_file')?.endNode()?.properties();
        const relations = [{ channel }];
        if (roomFile) relations.push({ roomFile });

        return dto(webhookInstance.properties(), relations);
    }

    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.room_uuid) throw new ControllerError(400, 'No room_uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');

        const { room_uuid, user } = options;
        let { page, limit } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        if (page && isNaN(page)) throw new ControllerError(400, 'page must be a number');
        if (page && page < 1) throw new ControllerError(400, 'page must be greater than 0');
        if (limit && limit < 1) throw new ControllerError(400, 'limit must be greater than 0');
        if (limit && isNaN(limit)) throw new ControllerError(400, 'limit must be a number');
        if (page && !limit) throw new ControllerError(400, 'page requires limit');
        if (page) page = parseInt(page);
        if (limit) limit = parseInt(limit);

        const props = { room_uuid };
        let cypher = 
            `MATCH (c:Channel)-[:HAS_ROOM]->(r:Room { uuid: $room_uuid }) ` +
            `MATCH (cw:ChannelWebhook)-[:HAS_CHANNEL]->(c) ` +
            `OPTIONAL MATCH (cw)-[:HAS_ROOM_FILE]->(rf:RoomFile) ` +
            `OPTIONAL MATCH (rf)-[:HAS_ROOM_FILE_TYPE]->(ct:RoomFileType) ` +
            `ORDER BY cw.created_at DESC`;

        if (page && limit) {
            cypher += ' SKIP $skip LIMIT $limit';
            props.skip = neo4j.int((page - 1) * limit);
            props.limit = neo4j.int(limit);
        }

        if (!page && limit) {
            cypher += ' LIMIT $limit';
            props.limit = neo4j.int(limit);
        }

        cypher += ` RETURN cw, c, rf, ct`;

        const dbResult = await neodeInstance.cypher(cypher, props);
        const data = dbResult.records.map((record) => {
            const cw = record.get('cw').properties;
            const rel = [];
            if (record.get('c')) rel.push({ channel: record.get('c').properties });
            if (record.get('rf')) rel.push({ roomFile: record.get('rf').properties });
            if (record.get('ct')) rel.push({ roomFileType: record.get('ct').properties });
            return dto(cw, rel);
        });
        const count = await neodeInstance.cypher(
            `MATCH (r:Room { uuid: $room_uuid })-[:HAS_CHANNEL]->(c:Channel) ` +
            `MATCH (cw:ChannelWebhook)-[:HAS_CHANNEL]->(c) ` +
            `RETURN COUNT(cw) AS count`,
            { room_uuid }
        );
        const total = count.records[0].get('count').toNumber();
        const result = { data, total };

        if (page && limit) {
            result.page = page;
            result.pages = Math.ceil(total / limit);
        }

        if (limit) result.limit = limit;

        return result;
    }

    async create(options = { body: null, file: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');
        if (!options.body.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.body.name) throw new ControllerError(400, 'No name provided');
        if (!options.body.description) throw new ControllerError(400, 'No description provided');
        if (!options.body.channel_uuid) throw new ControllerError(400, 'No channel_uuid provided');

        const { body, file, user } = options;
        const { uuid, name, description, channel_uuid } = body;

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin in the room');
        }

        const channelInstance = await neodeInstance.model('Channel').find(channel_uuid);
        if (!channelInstance) throw new ControllerError(404, 'Channel not found');

        const uuidExists = await neodeInstance.model('ChannelWebhook').find(uuid);
        if (uuidExists) throw new ControllerError(400, 'Channel Webhook with that UUID already exists');

        const channelWebhookExists = await neodeInstance.cypher(
            `MATCH (cw:ChannelWebhook)-[:HAS_CHANNEL]->(c:Channel { uuid: $channel_uuid }) ` +
            `RETURN COUNT(cw) AS count`,
            { channel_uuid }
        );
        if (channelWebhookExists.records[0].get('count').toNumber() > 0) {
            throw new ControllerError(400, 'Channel already has a webhook');
        }

        const channelWebhook = await neodeInstance.model('ChannelWebhook').create({
            uuid,
            name,
            description,
        });

        await channelWebhook.relateTo(channelInstance, 'channel');

        if (file && file.size > 0) {
            const room = channelInstance.get('room').endNode().properties();
            const roomInstance = await neodeInstance.model('Room').find(room.uuid);
            const size = file.size;

            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid: room.uuid, bytes: size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid: room.uuid, bytes: size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }

            const roomFileType = await neodeInstance.model('RoomFileType').find('ChannelWebhookAvatar');
            const src = await storage.uploadFile(file, uuid);
            const roomFile = await neodeInstance.model('RoomFile').create({ uuid: uuidv4(), src, size });
            await roomFile.relateTo(roomFileType, 'room_file_type');
            await roomFile.relateTo(roomInstance, 'room');
            await channelWebhook.relateTo(roomFile, 'room_file');
        }

        return this.findOne({ uuid, user });
    }

    async update(options = { uuid: null, body: null, file: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');

        const { uuid, body, file, user } = options;
        const { name, description } = body;

        const webhookInstance = await neodeInstance.model('ChannelWebhook').find(uuid);
        if (!webhookInstance) throw new ControllerError(404, 'Channel Webhook not found');

        const channel = webhookInstance.get('channel').endNode().properties();
        if (!channel) throw new ControllerError(404, 'Channel not found');

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: channel.uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin in the room');
        }

        const props = {};
        if (name) props.name = name;
        if (description) props.description = description;
        if (Object.keys(props).length > 0) await webhookInstance.update(props);

        if (file && file.size > 0) {
            const size = file.size;
            const channelInstance = await neodeInstance.model('Channel').find(channel.uuid);
            const room = channelInstance.get('room').endNode().properties();
            const roomInstance = await neodeInstance.model('Room').find(room.uuid);
            const room_uuid = room.uuid;

            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid, bytes: size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid, bytes: size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }

            const roomFileType = await neodeInstance.model('RoomFileType').find('ChannelWebhookAvatar');
            const src = await storage.uploadFile(file, uuid);
            const roomFile = await neodeInstance.model('RoomFile').create({ uuid: uuidv4(), src, size });
            await roomFile.relateTo(roomFileType, 'room_file_type');
            await roomFile.relateTo(roomInstance, 'room');
            await webhookInstance.relateTo(roomFile, 'room_file');
        }

        return this.findOne({ uuid, user });
    }

    async destroy(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');

        const { uuid, user } = options;

        const webhookInstance = await neodeInstance.model('ChannelWebhook').find(uuid);
        if (!webhookInstance) throw new ControllerError(404, 'Channel Webhook not found');

        const channel = webhookInstance.get('channel').endNode().properties();
        if (!channel) throw new ControllerError(404, 'Channel not found');

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: channel.uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin in the room');
        }

        const src = webhookInstance.get('room_file')?.endNode()?.properties()?.src;

        const session = neodeInstance.session();
        session.writeTransaction(async (transaction) => {
            await transaction.run(
                `MATCH (cw:ChannelWebhook { uuid: $uuid }) ` +
                `OPTIONAL MATCH (rf:RoomFile)-[:HAS_ROOM_FILE]->(cw) ` +
                `OPTIONAL MATCH (cw)-[:HAS_CHANNEL_WEBHOOK_MESSAGE]->(cwm:ChannelWebhookMessage) ` +
                `OPTIONAL MATCH (cm:ChannelMessage)-[:HAS_CHANNEL_WEBHOOK_MESSAGE]->(cwm) ` +
                `DETACH DELETE cw, rf, cwm, cm`,
                { uuid }
            );

            if (src) {
                const key = storage.parseKey(src);
                await storage.deleteFile(key);
            }
        });
    }

    async message(options = { uuid: null, body: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.body.message) throw new ControllerError(400, 'No message provided');

        const { uuid, body } = options;
        const { message } = body;

        const webhookInstance = await neodeInstance.model('ChannelWebhook').find(uuid);
        if (!webhookInstance) throw new ControllerError(404, 'Channel Webhook not found');

        const channel = webhookInstance.get('channel').endNode().properties();
        if (!channel) throw new ControllerError(404, 'Channel not found');
        const channelInstance = await neodeInstance.model('Channel').find(channel.uuid);

        const channelMessageType = await neodeInstance.model('ChannelMessageType').find('Webhook');
        if (!channelMessageType) throw new ControllerError(500, 'Channel Message Type not found');

        const channelWebhookMessageType = await neodeInstance.model('ChannelWebhookMessageType').find('Custom');
        if (!channelWebhookMessageType) throw new ControllerError(500, 'Channel Webhook Message Type not found');

        const channelWebhookMessage = await neodeInstance.model('ChannelWebhookMessage').create({
            uuid: uuidv4(),
            body: message,
        });

        const channelMessage = await neodeInstance.model('ChannelMessage').create({
            uuid: uuidv4(),
            body: message,
        });

        await channelMessage.relateTo(channelInstance, 'channel');
        await channelMessage.relateTo(channelMessageType, 'channel_message_type');
        await channelMessage.relateTo(channelWebhookMessage, 'channel_webhook_message');

        await channelWebhookMessage.relateTo(webhookInstance, 'channel_webhook');
        await channelWebhookMessage.relateTo(channelWebhookMessageType, 'channel_webhook_message_type');

        const channel_uuid = channel.uuid;

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was deleted.
          */
        broadcastChannel(`channel-${channel_uuid}`, 'chat_message_created', { channel_uuid });
    }
}

const service = new Service();

export default service;
