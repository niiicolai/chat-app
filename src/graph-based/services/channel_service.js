import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/channel_dto.js';
import neo4j from 'neo4j-driver';

const storage = new StorageService('channel_avatar');

console.error('TODO: implement destroy method in channel_service.js');

class Service {

    async findOne(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');

        const { user, uuid } = options;

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const channelInstance = await neodeInstance.model('Channel').find(uuid);
        if (!channelInstance) throw new ControllerError(404, 'Channel not found');

        const channelType = channelInstance.get('channel_type').endNode().properties();
        const room = channelInstance.get('room').endNode().properties();

        return dto(channelInstance.properties(), [{ channelType }, { room }]);
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
            `MATCH (c:Channel)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid})
             MATCH (c)-[:HAS_CHANNEL_TYPE]->(ct:ChannelType)
             OPTIONAL MATCH (c)-[:HAS_CHANNEL_FILE]->(rf:RoomFile)
             ORDER BY c.created_at DESC`

        if (page && limit) {
            cypher += ' SKIP $skip LIMIT $limit';
            props.skip = neo4j.int((page - 1) * limit);
            props.limit = neo4j.int(limit);
        }

        if (!page && limit) {
            cypher += ' LIMIT $limit';
            props.limit = neo4j.int(limit);
        }

        cypher += ` RETURN c, r, ct, rf`;

        const dbResult = await neodeInstance.cypher(cypher, props);
        const data = dbResult.records.map((record) => {
            const channel = record.get('c').properties;
            return dto(channel, [
                { channelType: record.get('ct').properties },
                { room: record.get('r').properties },
                { roomFile: record.get('rf') ? record.get('rf').properties : null },
            ]);
        });
        const count = await neodeInstance.cypher(
            `MATCH (c:Channel)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid}) RETURN count(c)`,
            { room_uuid }
        );
        const total = count.records[0].get('count(c)').toNumber();
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
        if (!options.body.uuid) throw new ControllerError(400, 'No body.uuid provided');
        if (!options.body.name) throw new ControllerError(400, 'No body.name provided');
        if (!options.body.description) throw new ControllerError(400, 'No body.description provided');
        if (!options.body.channel_type_name) throw new ControllerError(400, 'No body.channel_type_name provided');
        if (!options.body.room_uuid) throw new ControllerError(400, 'No body.room_uuid provided');

        const { body, file, user } = options;
        const { uuid, name, description, channel_type_name, room_uuid } = body;

        const roomInstance = await neodeInstance.model('Room').find(room_uuid);
        if (!roomInstance) throw new ControllerError(404, 'Room not found');

        const channelTypeInstance = await neodeInstance.model('ChannelType').find(channel_type_name);
        if (!channelTypeInstance) throw new ControllerError(404, 'Channel type not found');

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        if (await RoomPermissionService.channelCountExceedsLimit({ room_uuid, add_count: 1 })) {
            throw new ControllerError(400, 'Room channel count exceeds limit. The room cannot have more channels');
        }

        const channelInstance = await neodeInstance.model('Channel').create({ uuid, name, description });

        await channelInstance.relateTo(roomInstance, 'room');
        await channelInstance.relateTo(channelTypeInstance, 'channel_type');

        if (file && file.size > 0) {
            const { size } = file;

            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid, bytes: size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }

            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid, bytes: size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }

            const roomFileTypeInstance = await neodeInstance.model('RoomFileType').find('ChannelAvatar');
            const src = await storage.uploadFile(file, uuid);
            const roomFileInstance = await neodeInstance.model('RoomFile').create({ uuid, src, size });

            await channelInstance.relateTo(roomFileInstance, 'room_file');
            await roomFileInstance.relateTo(roomInstance, 'room');
            await roomFileInstance.relateTo(roomFileTypeInstance, 'room_file_type');
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

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        const channelInstance = await neodeInstance.model('Channel').find(uuid);
        if (!channelInstance) throw new ControllerError(404, 'Channel not found');

        const props = {};
        if (name) props.name = name;
        if (description) props.description = description;
        if (Object.keys(props).length) await channelInstance.update(props);

        if (file && file.size > 0) {
            const room = await channelInstance.get('room').endNode().properties();
            const oldRoomFile = await channelInstance.get('room_file').endNode();
            if (oldRoomFile) {
                console.warn('TODO: delete old file');
                channelInstance.detachFrom(oldRoomFile);
            }

            const { size } = file;

            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid: room.uuid, bytes: size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }

            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid: room.uuid, bytes: size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }

            const roomFileTypeInstance = await neodeInstance.model('RoomFileType').find('ChannelAvatar');
            const src = await storage.uploadFile(file, uuid);
            const roomFileInstance = await neodeInstance.model('RoomFile').create({ uuid, src, size });

            await channelInstance.relateTo(roomFileInstance, 'room_file');
            await roomFileInstance.relateTo(channelInstance, 'channel');
            await roomFileInstance.relateTo(roomFileTypeInstance, 'room_file_type');
        }

        return this.findOne({ uuid, user });
    }
            
    async destroy(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');

        const { uuid, user } = options;

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        

        const channel = await Channel.findOne({ uuid })
            .populate('room_file')
            .populate('room');
        if (!channel) {
            throw new ControllerError(404, 'Channel not found');
        }

        if (channel.room_file) {
            await storage.deleteFile(storage.parseKey(channel.room_file.src));
            await RoomFile.deleteOne({ uuid: channel.room_file.uuid });
        }

        const channelWebhooks = await ChannelWebhook.find({ channel: channel._id }).populate('room_file');
        const channelWebhookRoomFileIds = channelWebhooks.filter((channelWebhook) => channelWebhook.room_file).map((channelWebhook) => channelWebhook.room_file._id);
        if (channelWebhookRoomFileIds.length) {
            await RoomFile.deleteMany({ _id: { $in: channelWebhookRoomFileIds } });
        }
        await ChannelWebhookMessage.deleteMany({ channel_webhook: { $in: channelWebhooks.map((channelWebhook) => channelWebhook._id) } });
        await ChannelWebhook.deleteMany({ channel: channel._id });

        const channelMessages = await ChannelMessage.find({ channel: channel._id })
            .populate({
                path: 'channel_message_upload',
                model: 'ChannelMessageUpload',
                populate: {
                    path: 'room_file',
                    model: 'RoomFile',
                },
            });

        const roomFileIds = [];
        const channelMessageUploadIds = [];
        channelMessages.forEach((channelMessage) => {
            if (channelMessage.channel_message_upload) {
                channelMessageUploadIds.push(channelMessage.channel_message_upload._id);                
                roomFileIds.push(channelMessage.channel_message_upload.room_file._id);

                storage.deleteFile(storage.parseKey(channelMessage.channel_message_upload.room_file.src));
            }
        });
        
        await ChannelMessage.deleteMany({ channel: channel._id });
        await ChannelMessageUpload.deleteMany({ _id: { $in: channelMessageUploadIds } });
        await RoomFile.deleteMany({ _id: { $in: roomFileIds } });
        await RoomJoinSettings.findOne({ join_channel: channel._id }).updateOne({ join_channel: null });

        await Channel.deleteOne({ uuid });
    }
}

const service = new Service();

export default service;
