import Validator from '../../shared/validators/channel_service_validator.js';
import err from '../../shared/errors/index.js';
import StorageService from '../../shared/services/storage_service.js';
import RPS from './room_permission_service.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/channel_dto.js';
import { v4 as uuidv4 } from 'uuid';
import neo4j from 'neo4j-driver';

/**
 * @constant storage
 * @description Storage service instance
 * @type {StorageService}
 */
const storage = new StorageService('channel_avatar');

/**
 * @class ChannelService
 * @description Service class for channels
 * @exports ChannelService
 */
class ChannelService {

    /**
     * @function findOne
     * @description Find a channel by uuid
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.user
     * @param {Object} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const { user, uuid } = options;

        const channelInstance = await neodeInstance.model('Channel').find(uuid);
        if (!channelInstance) throw new err.EntityNotFoundError('channel');

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid: uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const channelType = channelInstance.get('channel_type').endNode().properties();
        const room = channelInstance.get('room').startNode().properties();

        return dto({
            ...channelInstance.properties(),
            channelType,
            room,
        });
    }

    /**
     * @function findAll
     * @description Find all channels in a room
     * @param {Object} options
     * @param {string} options.room_uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = Validator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        const isInRoom = await RPS.isInRoom({ room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const result = await neodeInstance.cypher(
            `MATCH (r:Room { uuid: $room_uuid })-[:COMMUNICATES_IN]->(c:Channel) ` +
            `MATCH (c)-[:TYPE_IS]->(ct:ChannelType) ` +
            `OPTIONAL MATCH (cw)-[:CHANNEL_AVATAR_IS]->(rf:RoomFile) ` +
            `OPTIONAL MATCH (rf)-[:TYPE_IS]->(rft:RoomFileType) ` +
            `ORDER BY c.created_at DESC ` +
            (offset ? `SKIP $offset ` : ``) +
            (limit ? `LIMIT $limit ` : ``) +
            `RETURN cw, c, rft, r, ct, rf, COUNT(c) AS total`,
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
                ...record.get('c').properties,
                room: record.get('r').properties,
                channelType: record.get('ct').properties,
                ...(record.get('rf') && {
                    roomFile: {
                        ...record.get('rf').properties,
                        roomFileType: record.get('rft').properties
                    }
                }),
            })),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }

    /**
     * @function create
     * @description Create a channel
     * @param {Object} options
     * @param {Object} options.body
     * @param {string} options.body.uuid
     * @param {string} options.body.name
     * @param {string} options.body.description
     * @param {string} options.body.channel_type_name
     * @param {string} options.body.room_uuid
     * @param {Object} options.file optional
     * @param {Object} options.user
     * @param {Object} options.user.sub
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, file: null, user: null }) {
        Validator.create(options);

        const { body, file, user } = options;
        const { uuid, name, description, channel_type_name, room_uuid } = body;

        const [room, uuidUsed, channelType, isAdmin, exceedsChannelCount, nameAndType] = await Promise.all([
            neodeInstance.model('Room').find(room_uuid),
            neodeInstance.model('Channel').find(uuid),
            neodeInstance.model('ChannelType').find(channel_type_name),
            RPS.isInRoom({ room_uuid, user, role_name: 'Admin' }),
            RPS.channelCountExceedsLimit({ room_uuid, add_count: 1 }),
            neodeInstance.cypher(
                `MATCH (c:Channel { name: $name })<-[:COMMUNICATES_IN]-(r:Room) ` +
                `MATCH (ct:ChannelType { name: $channel_type_name }) ` +
                `RETURN COUNT(c) + COUNT(ct) AS count`,
                { name, channel_type_name }
            )
        ]);

        if (!room) throw new err.EntityNotFoundError('room');
        if (uuidUsed) throw new err.DuplicateEntryError('channel', 'PRIMARY', uuid);
        if (!channelType) throw new err.EntityNotFoundError('channel_type_name');
        if (!isAdmin) throw new err.AdminPermissionRequiredError();
        if (exceedsChannelCount) throw new err.ExceedsRoomChannelCountError();
        if (nameAndType.records[0].get('count').low > 0) {
            throw new err.DuplicateEntryError('channel', 'name_type_room_uuid', `${name}-${channel_type_name}-${room_uuid} already exists`);
        }

        const room_file_src = await this.createAvatar({ uuid, room_uuid, file });

        // Create transaction
        const session = neodeInstance.session();
        await session.writeTransaction(async (transaction) => {
            await transaction.run(
                `MATCH (r:Room { uuid: $room_uuid }) ` +
                `MATCH (ct:ChannelType { name: $channel_type_name }) ` +
                `CREATE (c:Channel { uuid: $uuid, name: $name, description: $description, created_at: datetime(), updated_at: datetime() }) ` +
                `CREATE (r)-[:COMMUNICATES_IN]->(c) ` +
                `CREATE (c)-[:TYPE_IS]->(ct) ` +
                `RETURN c`,
                { uuid, name, description, room_uuid, channel_type_name }
            );

            if (room_file_src) {
                await transaction.run(
                    `MATCH (c:Channel { uuid: $uuid }) ` +
                    `MATCH (r:Room { uuid: $room_uuid }) ` +
                    `MATCH (rft:RoomFileType { name: 'ChannelAvatar' }) ` +
                    `CREATE (rf:RoomFile { uuid: $rf_uuid, size: $size, src: $src, created_at: datetime(), updated_at: datetime() }) ` +
                    `CREATE (c)-[:CHANNEL_AVATAR_IS]->(rf) ` +
                    `CREATE (rf)-[:STORED_IN]->(r) ` +
                    `CREATE (rf)-[:TYPE_IS]->(rft)`,
                    { uuid, room_uuid, size, rf_uuid: uuidv4() }
                );
            }
        }).catch(err => {
            if (room_file_src) storage.deleteFile(storage.parseKey(room_file_src));
            throw err;
        }).finally(() => session.close());


        return this.findOne({ uuid, user });
    }

    /**
     * @function update
     * @description Update a channel
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.body
     * @param {string} options.body.name optional
     * @param {string} options.body.description optional
     * @param {Object} options.file optional
     * @param {Object} options.user
     * @param {Object} options.user.sub
     * @returns {Promise<Object>}
     */
    async update(options = { uuid: null, body: null, file: null, user: null }) {
        Validator.update(options);

        const { uuid, body, file, user } = options;
        const { name, description } = body;

        const channel = await neodeInstance.model('Channel').find(uuid);
        if (!channel) throw new err.EntityNotFoundError('channel');

        const channelProps = channel.properties();
        const channelType = await channel.get('channel_type').endNode().properties();

        if (name && name !== channelProps.name) {
            const nameAndTypeExists = await neodeInstance.cypher(
                `MATCH (c:Channel { name: $name })<-[:COMMUNICATES_IN]-(r:Room) ` +
                `MATCH (ct:ChannelType { name: $channel_type_name }) ` +
                `RETURN COUNT(c) + COUNT(ct) AS count`,
                { name, channel_type_name: channelType.name }
            );
            if (nameAndTypeExists.records[0].get('count').low > 0) {
                throw new err.DuplicateEntryError('channel', 'name_type_room_uuid', `${name}-${channel_type_name}-${room_uuid} already exists`);
            }
        }

        const isAdmin = await RPS.isInRoomByChannel({ channel_uuid: uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const room = channel.get('room').startNode().properties();
        const oldRoomFile = channel.get('room_file')?.endNode()?.properties();
        const room_file_src = await this.createAvatar({ uuid, room_uuid: room.uuid, file });

        const session = neodeInstance.session();
        await session.writeTransaction(async (tx) => {
            if (name) await tx.run(
                `MATCH (c:Channel { uuid: $uuid }) ` +
                `SET c.name = $name `,
                { uuid, name }
            );

            if (description) await tx.run(
                `MATCH (c:Channel { uuid: $uuid }) ` +
                `SET c.description = $description `,
                { uuid, description }
            );

            if (room_file_src) {
                // Delete old room file
                if (oldRoomFile) await tx.run(
                    'MATCH (rf:RoomFile { uuid: $room_file_uuid }) ' +
                    'DETACH DELETE rf',
                    { room_file_uuid: oldRoomFile.uuid }
                );
                await tx.run(
                    `MATCH (c:Channel { uuid: $uuid }) ` +
                    `MATCH (r:Room { uuid: $room_uuid }) ` +
                    `MATCH (rft:RoomFileType { name: 'ChannelAvatar' }) ` +
                    `CREATE (rf:RoomFile { uuid: $rf_uuid, size: $size, src: $src, created_at: datetime(), updated_at: datetime() }) ` +
                    `CREATE (c)-[:CHANNEL_AVATAR_IS]->(rf) ` +
                    `CREATE (rf)-[:STORED_IN]->(r) ` +
                    `CREATE (rf)-[:TYPE_IS]->(rft)`,
                    { uuid, room_uuid, size, rf_uuid: uuidv4() }
                );
            }
        }).catch(err => {
            if (room_file_src) storage.deleteFile(storage.parseKey(room_file_src));
            throw err;
        }).finally(() => session.close());

        return this.findOne({ uuid, user });
    }

    /**
     * @function destroy
     * @description Delete a channel
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.user
     * @param {Object} options.user.sub
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null, user: null }) {
        Validator.destroy(options);

        const { uuid, user } = options;

        const channel = await neodeInstance.model('Channel').find(uuid);
        if (!channel) throw new err.EntityNotFoundError('channel');

        const isAdmin = await RPS.isInRoomByChannel({ channel_uuid: uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const roomFile = await channel.get('room_file')?.endNode()?.properties();
        const src = roomFile?.src;

        const session = neodeInstance.session();
        await session.writeTransaction(async (transaction) => {
            await transaction.run(
                `MATCH (c:Channel { uuid: $uuid }) ` +
                `OPTIONAL MATCH (c)-[:CHANNEL_AVATAR_IS]->(rf:RoomFile) ` +
                `OPTIONAL MATCH (cw:ChannelWebhook)-[:WRITE_TO]->(c) ` +
                `OPTIONAL MATCH (cwm:ChannelWebhookMessage)-[:GENERATED_BY]->(cw) ` +
                `OPTIONAL MATCH (cm:ChannelMessage)-[:WRITTEN_IN]->(c) ` +
                `OPTIONAL MATCH (cm)-[:UPLOAD_IS]->(cmu:ChannelMessageUpload)-[:STORED_AS]->(cmurf:RoomFile) ` +
                `OPTIONAL MATCH (cw)-[:WEBHOOK_AVATAR_IS]->(cwrf:RoomFile) ` +
                `DETACH DELETE c, rf, cw, cwm, cm, cmu, cmurf, cwrf`,
                { uuid }
            );

            if (src) {
                const key = storage.parseKey(src);
                await storage.deleteFile(key);
            }
        }).catch(err => {
            console.error(err);
            throw err;
        }).finally(() => session.close());
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

const service = new ChannelService();

export default service;
