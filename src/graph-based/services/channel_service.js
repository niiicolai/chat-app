import ChannelServiceValidator from '../../shared/validators/channel_service_validator.js';
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
        ChannelServiceValidator.findOne(options);

        const { user, uuid } = options;

        const channelInstance = await neodeInstance.model('Channel').find(uuid);
        if (!channelInstance) throw new ControllerError(404, 'channel not found');

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const channelType = channelInstance.get('channel_type').endNode().properties();
        const room = channelInstance.get('room').endNode().properties();

        return dto(channelInstance.properties(), [{ channelType }, { room }]);
    }

    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = ChannelServiceValidator.findAll(options);

        const { room_uuid, user, page, limit } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return super.findAll({
            page, limit, override: {
                match: [
                    'MATCH (c:Channel)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid})',
                    'MATCH (c)-[:HAS_CHANNEL_TYPE]->(ct:ChannelType)',
                    'OPTIONAL MATCH (c)-[:HAS_CHANNEL_FILE]->(rf:RoomFile)',
                ],
                return: ['c', 'r', 'ct', 'rf'],
                map: {
                    model: 'c', relationships: [
                        { alias: 'r', to: 'room' },
                        { alias: 'ct', to: 'channelType' },
                        { alias: 'rf', to: 'roomFile' },
                    ]
                },
                params: { room_uuid }
            }
        });
    }

    async create(options = { body: null, file: null, user: null }) {
        ChannelServiceValidator.create(options);

        const { body, file, user } = options;
        const { uuid, name, description, channel_type_name, room_uuid } = body;

        const [room, channelType, isAdmin, exceedsChannelCount] = await Promise.all([
            neodeInstance.model('Room').find(room_uuid),
            neodeInstance.model('ChannelType').find(channel_type_name),
            RoomPermissionService.isInRoom({ room_uuid, user, role_name: 'Admin' }),
            RoomPermissionService.channelCountExceedsLimit({ room_uuid, add_count: 1 }),
        ]);

        if (!room) throw new ControllerError(404, 'Room not found');
        if (!channelType) throw new ControllerError(404, 'Channel type not found');
        if (!isAdmin) throw new ControllerError(403, 'User is not an admin of the room');
        if (exceedsChannelCount) throw new ControllerError(400, 'Room channel count exceeds limit. The room cannot have more channels');

        if (file && file.size > 0) {
            const [exceedsTotal, exceedsSingle] = await Promise.all([
                RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid, bytes: file.size }),
                RoomPermissionService.fileExceedsSingleFileSize({ room_uuid, bytes: file.size }),
            ]);

            if (exceedsTotal) throw new ControllerError(400, 'The room does not have enough space for this file');
            if (exceedsSingle) throw new ControllerError(400, 'File exceeds single file size limit');
        }

        // Create transaction
        const session = neodeInstance.session();
        const result = await session.writeTransaction(async (transaction) => {
            const channel = await transaction.run(
                `MATCH (r:Room { uuid: $room_uuid }) ` +
                `MATCH (ct:ChannelType { name: $channel_type_name }) ` +
                `CREATE (c:Channel { uuid: $uuid, name: $name, description: $description }) ` +
                `CREATE (r)-[:COMMUNICATES_IN]->(c) ` +
                `CREATE (c)-[:TYPE_IS]->(ct) ` +
                `RETURN c`,
                { uuid, name, description, room_uuid, channel_type_name }
            );

            if (file && file.size > 0) {
                const { size } = file;
                // Upload using a two step process
                // to ensure the room file is valid before uploading
                // and not end up with a file that is not linked to a room file.
                // Ensure the room file is valid
                await transaction.run(
                    `MATCH (c:Channel { uuid: $uuid }) ` +
                    `MATCH (r:Room { uuid: $room_uuid }) ` +
                    `MATCH (rft:RoomFileType { name: 'ChannelAvatar' }) ` +
                    `CREATE (rf:RoomFile { uuid: $uuid, size: $size }) ` +
                    `CREATE (c)-[:AVATAR_IS]->(rf) ` +
                    `CREATE (rf)-[:STORED_IN]->(r) ` +
                    `CREATE (rf)-[:TYPE_IS]->(rft)`,
                    { uuid, room_uuid, size }
                );
                
                // then ensure the file is uploaded
                const src = await storage.uploadFile(file, uuid);
                // then update the room file
                await transaction.run(
                    `MATCH (rf:RoomFile { uuid: $uuid }) ` +
                    `SET rf.src = $src ` +
                    `RETURN rf`,
                    { uuid, src }
                );
            }
        });


        return this.findOne({ uuid, user });
    }

    async update(options = { uuid: null, body: null, file: null, user: null }) {
        ChannelServiceValidator.update(options);

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
        ChannelServiceValidator.destroy(options);

        const { uuid, user } = options;

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        const channelInstance = await neodeInstance.model('Channel').find(uuid);
        if (!channelInstance) throw new ControllerError(404, 'Channel not found');

        const roomFile = await channelInstance.get('room_file')?.endNode()?.properties();
        const src = roomFile?.src;

        await channelInstance.delete();

        /*
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
        });*/
    }
}

const service = new Service();

export default service;
