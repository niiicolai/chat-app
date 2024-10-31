import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import neodeInstance from '../neode/index.js';
import NeodeBaseFindService from './neode_base_find_service.js';
import dto from '../dto/channel_dto.js';

const storage = new StorageService('channel_avatar');

class Service extends NeodeBaseFindService {

    constructor() {
        super('uuid', 'Channel', dto);
    }

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

        const { room_uuid, user, page, limit } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return super.findAll({ page, limit, override: {
            match: [
                'MATCH (c:Channel)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid})',
                'MATCH (c)-[:HAS_CHANNEL_TYPE]->(ct:ChannelType)',
                'OPTIONAL MATCH (c)-[:HAS_CHANNEL_FILE]->(rf:RoomFile)',
            ],
            return: ['c', 'r', 'ct', 'rf'],
            map: { model: 'c', relationships: [
                { alias: 'r', to: 'room' },
                { alias: 'ct', to: 'channelType' },
                { alias: 'rf', to: 'roomFile' },
            ]},
            params: { room_uuid }
        }}); 
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

        const channelInstance = await neodeInstance.model('Channel').find(uuid);
        if (!channelInstance) throw new ControllerError(404, 'Channel not found');

        const roomFile = await channelInstance.get('room_file')?.endNode()?.properties();
        const src = roomFile?.src;

        const session = neodeInstance.session();
        session.writeTransaction(async (transaction) => {
            await transaction.run(
                `MATCH (c:Channel { uuid: $uuid }) ` +
                `OPTIONAL MATCH (cw:ChannelWebhook)-[:HAS_CHANNEL]->(c) ` +
                `OPTIONAL MATCH (cwm:ChannelWebhookMessage)-[:HAS_CHANNEL_WEBHOOK]->(cw) ` +
                `OPTIONAL MATCH (c)-[:HAS_CHANNEL_FILE]->(rf:RoomFile) ` +
                `OPTIONAL MATCH (c)-[:HAS_CHANNEL_MESSAGE]->(cm:ChannelMessage) ` +
                `OPTIONAL MATCH (cm)-[:HAS_CHANNEL_MESSAGE_UPLOAD]->(cmu:ChannelMessageUpload)-[:HAS_ROOM_FILE]->(cmurf:RoomFile) ` +
                `OPTIONAL MATCH (cw)-[:HAS_ROOM_FILE]->(cwrf:RoomFile) ` +
                `DETACH DELETE c, rf, cm, cmu, cw, cwm, cwrf, cmurf`,
                { uuid }
            );

            if (src) {
                const key = storage.parseKey(src);
                await storage.deleteFile(key);
            }

            console.warn('TODO: delete all channel messages files and webhook files');
        });
    }
}

const service = new Service();

export default service;
