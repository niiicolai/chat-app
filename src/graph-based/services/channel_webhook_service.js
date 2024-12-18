import Validator from '../../shared/validators/channel_webhook_service_validator.js';
import err from '../../shared/errors/index.js';
import StorageService from '../../shared/services/storage_service.js';
import BroadcastChannelService from '../../shared/services/broadcast_channel_service.js';
import RPS from './room_permission_service.js';
import dto from '../dto/channel_webhook_dto.js';
import channelMessageDto from '../dto/channel_message_dto.js';
import neodeInstance from '../neode/index.js';
import { v4 as uuidv4 } from 'uuid';
import neo4j from 'neo4j-driver';

/**
 * @constant storage
 * @description Storage service instance
 * @type {StorageService}
 */
const storage = new StorageService('channel_avatar');

/**
 * @class ChannelWebhookService
 * @description Service class for channel webhooks
 * @exports ChannelWebhookService
 */
class ChannelWebhookService {

    /**
     * @function findOne
     * @description Find a channel webhook by UUID
     * @param {Object} options - The options object
     * @param {string} options.uuid - The channel webhook UUID
     * @param {Object} options.user - The user object
     * @param {Object} options.user.sub - The user UUID
     * @returns {Promise<Object>} The channel webhook object
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const webhhook = await neodeInstance.model('ChannelWebhook').find(options.uuid);
        if (!webhhook) throw new err.EntityNotFoundError('channel_webhook');

        const channel = webhhook.get('channel').endNode().properties();
        const roomFile = webhhook.get('room_file')?.endNode();
        const roomFileType = roomFile?.get('room_file_type')?.endNode();

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid: channel.uuid, user: options.user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto({
            ...webhhook.properties(),
            channel,
            roomFile: roomFile?.properties(),
            roomFileType: roomFileType?.properties(),
        });
    }

    /**
     * @function findAll
     * @description Find all channel webhooks in a room
     * @param {Object} options - The options object
     * @param {string} options.room_uuid - The room UUID
     * @param {Object} options.user - The user object
     * @param {Object} options.user.sub - The user UUID
     * @param {number} options.page - The page number (optional)
     * @param {number} options.limit - The limit number (optional)
     * @returns {Promise<Object>} The channel webhook object
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = Validator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        const isInRoom = await RPS.isInRoom({ room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const result = await neodeInstance.cypher(
            `MATCH (r:Room { uuid: $room_uuid })-[:COMMUNICATES_IN]->(c:Channel) ` +
            `MATCH (c)<-[:WRITE_TO]-(cw:ChannelWebhook) ` +
            `OPTIONAL MATCH (cw)-[:WEBHOOK_AVATAR_IS]->(ra:RoomFile) ` +
            `OPTIONAL MATCH (ra)-[:TYPE_IS]->(rat:RoomFileType) ` +
            `ORDER BY cw.created_at DESC ` +
            (offset ? `SKIP $offset ` : ``) +
            (limit ? `LIMIT $limit ` : ``) +
            `RETURN cw, c, ra, rat, COUNT(cw) AS total`,
            {
                ...(offset && { offset: neo4j.int(offset) }),
                ...(limit && { limit: neo4j.int(limit) }),
                room_uuid
            }
        );

        const total = result.records.length > 0 
            ? result.records[0].get('total').low
            : 0;

        return {
            total,
            data: result.records.map(record => dto({
                ...record.get('cw').properties,
                channel: record.get('c').properties,
                roomFile: record.get('ra')?.properties,
                roomFileType: record.get('rat')?.properties,
            })),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }

    /**
     * @function create
     * @description Create a channel webhook
     * @param {Object} options - The options object
     * @param {Object} options.body - The request body
     * @param {File} options.file - The request file
     * @param {Object} options.user - The user object
     * @param {string} options.user.sub - The user UUID
     * @returns {Promise<Object>} The channel webhook object
     */
    async create(options = { body: null, file: null, user: null }) {
        Validator.create(options);

        const { body, file, user } = options;
        const { uuid, name, description, channel_uuid } = body;

        const isAdmin = await RPS.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const channelResult = await neodeInstance.cypher(
            'MATCH (c:Channel { uuid: $channel_uuid }) ' +
            'MATCH (c)<-[:COMMUNICATES_IN]-(r:Room) ' +
            'OPTIONAL MATCH (cw:ChannelWebhook)-[:WRITE_TO]->(c) ' +
            'RETURN c, r, cw',
            { channel_uuid }
        );
        if (channelResult.records.length == 0) throw err.EntityNotFoundError('channel');

        const uuidExists = await neodeInstance.model('ChannelWebhook').find(uuid);
        if (uuidExists) throw new err.DuplicateEntryError('channel_webhook', 'uuid', uuid);

        const channelWebhookExists = channelResult.records[0]?.get('cw')?.properties;
        if (channelWebhookExists) throw new err.ControllerError(400, 'channel already has a webhook');

        const room = channelResult.records[0].get('r').properties;
        const room_file_src = await this.createAvatar({ uuid, room_uuid: room.uuid, file });

        const session = neodeInstance.session();
        await session.writeTransaction(async tx => {
            // Create channel webhook
            await tx.run(
                'MATCH (c:Channel { uuid: $channel_uuid }) ' +
                'CREATE (cw:ChannelWebhook {uuid: $uuid, name: $name, description: $description, created_at: datetime(), updated_at: datetime()}) ' +
                'CREATE (cw)-[:WRITE_TO]->(c)',
                { uuid, name, description, channel_uuid }
            );

            if (room_file_src) {
                // Create room file
                await tx.run(
                    'MATCH (cw:ChannelWebhook { uuid: $uuid }) ' +
                    'MATCH (r:Room { uuid: $room_uuid }) ' +
                    'MATCH (rft:RoomFileType { name: "ChannelWebhookAvatar" }) ' +
                    'MATCH (rf:RoomFile { uuid: $room_file_uuid, src: $room_file_src, size: $room_file_size, created_at: datetime(), updated_at: datetime() }) ' +
                    'CREATE (rf)-[:TYPE_IS]->(rft) ' +
                    'CREATE (rf)-[:STORED_IN]->(r) ' +
                    'CREATE (cw)-[:WEBHOOK_AVATAR_IS]->(rf)',
                    { room_uuid: room.uuid, room_file_uuid: uuidv4(), room_file_src, room_file_size: file.size }
                );
            }
        }).catch(error => {
            if (room_file_src) storage.deleteFile(storage.parseKey(room_file_src));
            console.error('transaction', error);
            throw error;
        }).finally(() => {
            session.close();
        });

        return await this.findOne({ uuid, user });
    }

    /**
     * @function update
     * @description Update a channel webhook
     * @param {Object} options - The options object
     * @param {string} options.uuid - The channel webhook UUID
     * @param {Object} options.body - The request body
     * @param {File} options.file - The request file
     * @param {Object} options.user - The user object
     * @param {string} options.user.sub - The user UUID
     * @returns {Promise<Object>} The channel webhook object
     */
    async update(options = { uuid: null, body: null, file: null, user: null }) {
        Validator.update(options);

        const { uuid, body, file, user } = options;
        const { name, description } = body;

        const result = await neodeInstance.cypher(
            'MATCH (cw:ChannelWebhook { uuid: $uuid })-[:WRITE_TO]->(c) ' +
            'MATCH (c)<-[:COMMUNICATES_IN]-(r:Room) ' +
            'OPTIONAL MATCH (cw)-[:WEBHOOK_AVATAR_IS]->(rf:RoomFile) ' +
            'RETURN c, cw, r, rf',
            { uuid }
        );
        if (result.records.length == 0) throw new err.EntityNotFoundError('channel_webhook');

        const webhhook = result.records[0].get('cw').properties;
        if (!webhhook) throw new err.EntityNotFoundError('channel_webhook');

        const room = result.records[0].get('r').properties;
        const oldRoomFile = result.records[0].get('rf')?.properties;

        const isAdmin = await RPS.isInRoom({ room_uuid: room.uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const room_file_src = await this.createAvatar({ uuid, room_uuid: room.uuid, file });

        const session = neodeInstance.session();
        await session.writeTransaction(async tx => {
            if (name) await tx.run(
                'MATCH (cw:ChannelWebhook { uuid: $uuid }) ' +
                'SET cw.name = $name',
                { uuid, name }
            );

            if (description) await tx.run(
                'MATCH (cw:ChannelWebhook { uuid: $uuid }) ' +
                'SET cw.description = $description',
                { uuid, description }
            );

            // update avatar
            if (room_file_src) {
                // Delete old avatar if exists
                if (oldRoomFile) await tx.run(
                    'MATCH (rf:RoomFile { uuid: $room_file_uuid }) ' +
                    'DETACH DELETE rf',
                    { room_file_uuid: oldRoomFile.uuid }
                );
                // Create room file
                await tx.run(
                    'MATCH (cw:ChannelWebhook { uuid: $uuid }) ' +
                    'MATCH (r:Room { uuid: $room_uuid }) ' +
                    'MATCH (rft:RoomFileType { name: "ChannelWebhookAvatar" }) ' +
                    'MATCH (rf:RoomFile { uuid: $room_file_uuid, src: $room_file_src, size: $room_file_size, created_at: datetime(), updated_at: datetime() }) ' +
                    'CREATE (rf)-[:TYPE_IS]->(rft) ' +
                    'CREATE (rf)-[:STORED_IN]->(r) ' +
                    'CREATE (cw)-[:WEBHOOK_AVATAR_IS]->(rf)',
                    { room_uuid: room.uuid, room_file_uuid: uuidv4(), room_file_src, room_file_size: file.size }
                );
            }

            // update updated_at
            await tx.run(
                'MATCH (cw:ChannelWebhook { uuid: $uuid }) ' +
                'SET cw.updated_at = datetime()',
                { uuid }
            );
        }).catch(error => {
            if (room_file_src) storage.deleteFile(storage.parseKey(room_file_src));
            console.error('transaction', error);
            throw error;
        }).finally(() => {
            session.close();
        });

        return await this.findOne({ uuid, user });
    }

    /**
     * @function destroy
     * @description Destroy a channel webhook
     * @param {Object} options - The options object
     * @param {string} options.uuid - The channel webhook UUID
     * @param {Object} options.user - The user object
     * @param {string} options.user.sub - The user UUID
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null, user: null }) {
        Validator.destroy(options);

        const { uuid, user } = options;

        const result = await neodeInstance.cypher(
            'MATCH (cw:ChannelWebhook { uuid: $uuid })-[:WRITE_TO]->(c) ' +
            'MATCH (c)<-[:COMMUNICATES_IN]-(r:Room) ' +
            'OPTIONAL MATCH (cw)-[:WEBHOOK_AVATAR_IS]->(rf:RoomFile) ' +
            'RETURN c, cw, r, rf',
            { uuid }
        );
        if (result.records.length == 0) throw new err.EntityNotFoundError('channel_webhook');

        const webhhook = result.records[0].get('cw').properties;
        if (!webhhook) throw new err.EntityNotFoundError('channel_webhook');

        const room = result.records[0].get('r').properties;
        const roomFile = result.records[0].get('rf')?.properties;

        const isAdmin = await RPS.isInRoom({ room_uuid: room.uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const session = neodeInstance.session();
        await session.writeTransaction(async (transaction) => {
            await transaction.run(
                `MATCH (cw:ChannelWebhook { uuid: $uuid }) ` +
                `OPTIONAL MATCH (cw)-[:WEBHOOK_AVATAR_IS]->(rf:RoomFile) ` +
                `OPTIONAL MATCH (cw)<-[:WRITTEN_BY]-(cwm:ChannelWebhookMessage) ` +
                `OPTIONAL MATCH (cm:ChannelMessage)-[:GENERATED_BY]->(cwm) ` +
                `DETACH DELETE cw, rf, cwm, cm`,
                { uuid }
            );

            if (roomFile) {
                const key = storage.parseKey(roomFile.src);
                await storage.deleteFile(key);
            }
        }).catch(error => {
            console.error('transaction', error);
            throw error;
        }).finally(() => {
            session.close();
        });
    }

    /**
     * @function message
     * @description Send a message to a channel webhook
     * @param {Object} options - The options object
     * @param {string} options.uuid - The channel webhook UUID
     * @param {Object} options.body - The request body
     * @param {string} options.body.message - The message body
     * @returns {Promise<void>}
     */
    async message(options = { uuid: null, body: null }) {
        Validator.message(options);

        const { uuid, body } = options;
        const { message } = body;

        const result = await neodeInstance.cypher(
            'MATCH (cw:ChannelWebhook { uuid: $uuid })-[:WRITE_TO]->(c) ' +
            'MATCH (c)<-[:COMMUNICATES_IN]-(r:Room) ' +
            'OPTIONAL MATCH (cw)-[:WEBHOOK_AVATAR_IS]->(rf:RoomFile) ' +
            'RETURN c, cw, r, rf',
            { uuid }
        );
        if (result.records.length == 0) throw new err.EntityNotFoundError('channel_webhook');

        const webhhook = result.records[0].get('cw').properties;
        if (!webhhook) throw new err.EntityNotFoundError('channel_webhook');

        const channel = result.records[0].get('c').properties;
        const channelWebhookFile = result.records[0].get('rf')?.properties;

        try {
            const result = await neodeInstance.writeCypher(
                'MATCH (cw:ChannelWebhook { uuid: $uuid }) ' +
                'MATCH (cwt:ChannelWebhookMessageType { name: "Custom" }) ' +
                'MATCH (cmt:ChannelMessageType { name: "Webhook" }) ' +
                'CREATE (cwm:ChannelWebhookMessage { uuid: $cwm_uuid, body: $body, created_at: datetime(), updated_at: datetime() }) ' +
                'CREATE (cm:ChannelMessage { uuid: $cm_uuid, body: $body, created_at: datetime(), updated_at: datetime() }) ' +
                'CREATE (cwm)-[:WRITTEN_BY]->(cw) ' +
                'CREATE (cwm)-[:TYPE_IS]->(cwt) ' +
                'CREATE (cm)-[:GENERATED_BY]->(cwm) ' +
                'CREATE (cm)-[:TYPE_IS]->(cmt) ' +
                'RETURN cm, cmt, cwm, cwt',
                { uuid, cwm_uuid: uuidv4(), cm_uuid: uuidv4(), body: message }
            )

            const channelMessage = result.records[0].get('cm').properties;
            const channelMessageType = result.records[0].get('cmt').properties;
            const channelWebhookMessage = result.records[0].get('cwm').properties;
            const channelWebhookMessageType = result.records[0].get('cwt').properties;

            BroadcastChannelService.create(channelMessageDto({
                ...channelMessage,
                channelMessageType,
                channelWebhookMessage,
                channelWebhookMessageType,
                channelWebhookFile,
                channel,
            }))
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    /**
     * @function createAvatar
     * @description Create a channel webhook avatar (helper function)
     * @param {Object} options
     * @param {String} options.uuid
     * @param {String} options.room_uuid
     * @param {Object} options.file
     * @returns {Promise<String | null>}
     */
    async createAvatar(options = { uuid: null, room_uuid: null, file: null }) {
        if (!options) throw new Error('createAvatar: options is required');
        if (!options.uuid) throw new Error('createAvatar: options.uuid is required');
        if (!options.room_uuid) throw new Error('createAvatar: options.room_uuid is required');

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

const service = new ChannelWebhookService();

export default service;
