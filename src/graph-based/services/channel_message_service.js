import Validator from '../../shared/validators/channel_message_service_validator.js';
import err from '../../shared/errors/index.js';
import StorageService from '../../shared/services/storage_service.js';
import BroadcastChannelService from '../../shared/services/broadcast_channel_service.js';
import RPS from './room_permission_service.js';
import dto from '../dto/channel_message_dto.js';
import neodeInstance from '../neode/index.js';
import { v4 as uuidv4 } from 'uuid';
import { getUploadType } from '../../shared/utils/file_utils.js';
import neo4j from 'neo4j-driver';

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

        const message = await neodeInstance.model('ChannelMessage').find(uuid);
        if (!message) throw new err.EntityNotFoundError('channel_message');

        const channelMessageType = message.get('channel_message_type').endNode().properties();
        const channel = message.get('channel').endNode().properties();
        const channelMessageUpload = message.get('channel_message_upload')?.endNode()?.properties();
        const _user = message.get('user')?.endNode()?.properties();

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid: channel.uuid, user, role_name: null });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto({
            ...message.properties(),
            channelMessageType,
            channel,
            channelMessageUpload,
            user: _user
        });
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

        const channel = await neodeInstance.model('Channel').find(channel_uuid);
        if (!channel) throw new err.EntityNotFoundError('channel');

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const result = await neodeInstance.cypher(
            `MATCH (c:Channel { uuid: $channel_uuid }) ` +
            `MATCH (cm:ChannelMessage)-[:WRITTEN_IN]->(c) ` +
            `MATCH (cm)-[:WRITTEN_BY]->(u:User) ` +
            `MATCH (cm)-[:TYPE_IS]->(cmt:ChannelMessageType) ` +
            `OPTIONAL MATCH (cm)-[:UPLOAD_IS]->(cmu:ChannelMessageUpload)-[:SAVED_AS]->(rf:RoomFile)-[:TYPE_IS]->(rft:RoomFileType) ` +
            `ORDER BY cm.created_at DESC ` +
            (offset ? `SKIP $offset ` : ``) +
            (limit ? `LIMIT $limit ` : ``) +
            `RETURN COUNT(cm) AS total, cm, u, cmt, cmu, rf`,
            {
                ...(offset && { offset: neo4j.int(offset) }),
                ...(limit && { limit: neo4j.int(limit) }),
                channel_uuid
            }
        );

        const total = result.records.length > 0 
            ? result.records[0].get('total').low
            : 0;
            
        return {
            total,
            data: result.records.map(record => dto({
                ...record.get('cm').properties,
                channel: { uuid: channel_uuid },
                user: record.get('u').properties,
                channelMessageType: record.get('cmt').properties,
                channelMessageUpload: record.get('cmu')?.properties,
            })),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
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

        const channel = await neodeInstance.model('Channel').find(channel_uuid);
        if (!channel) throw new err.EntityNotFoundError('channel');

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const savedUser = await neodeInstance.model('User').find(user_uuid);
        if (!savedUser) throw new err.EntityNotFoundError('user');

        const room = channel.get('room').endNode().properties();
        const room_uuid = room.uuid;
        const room_file_src = await this.createUpload({ uuid, room_uuid, file });

        const session = neodeInstance.session();
        await session.writeTransaction(async (transaction) => {
            await transaction.run(
                `MATCH (u:User { uuid: $user_uuid }) ` +
                `MATCH (c:Channel { uuid: $channel_uuid }) ` +
                `MATCH (cmt:ChannelMessageType { name: "User" }) ` +
                `CREATE (cm:ChannelMessage { uuid: $uuid, body: $body, created_at: datetime(), updated_at: datetime() }) ` +
                `CREATE (cm)-[:WRITTEN_IN]->(c) ` +
                `CREATE (cm)-[:WRITTEN_BY]->(u) ` +
                `CREATE (cm)-[:TYPE_IS]->(cmt) ` +
                `RETURN c`,
                { uuid, body: msg, user_uuid, channel_uuid }
            );

            if (room_file_src) {
                await transaction.run(
                    `MATCH (cm:ChannelMessage { uuid: $cm_uuid }) ` +
                    `MATCH (r:Room { uuid: $room_uuid }) ` +
                    `MATCH (rft:RoomFileType { name: 'ChannelMessageUpload' }) ` +
                    `MATCH (cmut:ChannelMessageUploadType { name: $ch_upload_type_name }) ` +
                    `CREATE (cmu:ChannelMessageUpload { uuid: $cmu_uuid }) ` +
                    `CREATE (rf:RoomFile { uuid: $rf_uuid, size: $size, src: $src, created_at: datetime(), updated_at: datetime() }) ` +
                    `CREATE (cm)-[:UPLOAD_IS]->(cmu) ` +
                    `CREATE (cmu)-[:TYPE_IS]->(cmut) ` +
                    `CREATE (cmu)-[:SAVED_AS]->(rf) ` +
                    `CREATE (rf)-[:STORED_IN]->(r) ` +
                    `CREATE (rf)-[:TYPE_IS]->(rft)`,
                    { uuid, room_uuid, size, rf_uuid: uuidv4(), src: room_file_src, cmu_uuid: uuidv4(), ch_upload_type_name: getUploadType(file) }
                );
            }
        }).catch(err => {
            if (room_file_src) storage.deleteFile(storage.parseKey(room_file_src));
            throw err;
        }).finally(() => session.close());


        const result = await this.findOne({ uuid, user });
        BroadcastChannelService.create(result, user.sub);

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

        const channelMessage = await neodeInstance.model('ChannelMessage').find(uuid);
        if (!channelMessage) throw new err.EntityNotFoundError('channel_message');

        const channel = channelMessage.get('channel').endNode().properties();
        const messageUser = channelMessage.get('user')?.endNode()?.properties();

        const channel_uuid = channel.uuid;
        const isOwner = messageUser?.uuid === user_uuid;

        if (!isOwner &&
            !(await RPS.isInRoomByChannel({ channel_uuid, user, role_name: 'Moderator' })) &&
            !(await RPS.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }))) {
            throw new err.OwnershipOrLeastModRequiredError("channel_message");
        }

        if (msg) await channelMessage.update({ body: msg });

        const result = await this.findOne({ uuid, user });
        BroadcastChannelService.update(result, user.sub);

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

        const channelMessage = await neodeInstance.model('ChannelMessage').find(uuid);
        if (!channelMessage) throw new err.EntityNotFoundError('channel_message');

        const channel = channelMessage.get('channel').endNode().properties();
        const channelMessageUser = channelMessage.get('user')?.endNode()?.properties();

        const isOwner = channelMessageUser?.uuid === user_uuid;
        const channel_uuid = channel.uuid;

        if (!isOwner &&
            !(await RPS.isInRoomByChannel({ channel_uuid, user, role_name: 'Moderator' })) &&
            !(await RPS.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }))) {
            throw new err.OwnershipOrLeastModRequiredError("channel_message");
        }

        const session = neodeInstance.session();
        await session.writeTransaction(async (transaction) => {
            const srcResult = await transaction.run(
                `MATCH (cm:ChannelMessage { uuid: $uuid }) ` +
                `OPTIONAL MATCH (cm)-[:UPLOAD_IS]->(cmu:ChannelMessageUpload)-[:SAVED_AS]->(rf:RoomFile) ` +
                `RETURN rf.src AS src`,
                { uuid }
            );

            await transaction.run(
                `MATCH (cm:ChannelMessage { uuid: $uuid }) ` +
                `OPTIONAL MATCH (cm)-[:UPLOAD_IS]->(cmu:ChannelMessageUpload)-[:SAVED_AS]->(rf:RoomFile) ` +
                `DETACH DELETE cm, cmu, rf`,
                { uuid }
            );

            if (srcResult.records.length > 0 && srcResult.records[0].get('src')) {
                const src = srcResult.records[0].get('src');
                const key = storage.parseKey(src);
                await storage.deleteFile(key);
            }
        }).catch(err => {
            console.error(err);
            throw err;
        }).finally(() => session.close());

        BroadcastChannelService.destroy(channel_uuid, uuid, user.sub);
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
