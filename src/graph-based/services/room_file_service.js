import RoomFileServiceValidator from '../../shared/validators/room_file_service_validator.js';
import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import neodeInstance from '../neode/index.js';
import NeodeBaseFindService from './neode_base_find_service.js';
import dto from '../dto/room_file_dto.js';

/**
 * @constant storage
 * @description Storage service instance
 * @type {StorageService}
 */
const storage = new StorageService('room_file');

/**
 * @class RoomFileService
 * @description Service class for room files
 * @exports RoomFileService
 */
class RoomFileService extends NeodeBaseFindService {

    constructor() {
        super('uuid', 'RoomFile', dto);
    }

    async findOne(options = { uuid: null, user: null }) {
        RoomFileServiceValidator.findOne(options);

        const { user, uuid } = options;
        
        const roomFileInstance = await neodeInstance.model('RoomFile').find(uuid);
        if (!roomFileInstance) throw new ControllerError(404, 'room_file not found');

        const room = roomFileInstance.get('room').endNode().properties();
        if (!room) throw new ControllerError(404, 'Room not found');

        const roomFileType = roomFileInstance.get('room_file_type').endNode().properties();
        if (!roomFileType) throw new ControllerError(404, 'Room file type not found');

        if (!(await RoomPermissionService.isInRoom({ room_uuid: room.uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return dto(roomFileInstance.properties(), [{ room }, { roomFileType }]);
    }

    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        RoomFileServiceValidator.findAll(options);

        const { room_uuid, user, page, limit } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return super.findAll({ page, limit, override: {
            match: [
                'MATCH (rf:RoomFile)-[:HAS_ROOM]->(r:Room { uuid: $room_uuid })',
                'MATCH (rf)-[:HAS_ROOM_FILE_TYPE]->(ct:RoomFileType)',
                'OPTIONAL MATCH (cmu:ChannelMessageUpload)-[:HAS_ROOM_FILE]->(rf)',
                'OPTIONAL MATCH (cmu)-[:HAS_CHANNEL_MESSAGE_UPLOAD_TYPE]->(cmt)',
                'OPTIONAL MATCH (cm:ChannelMessage)-[:HAS_CHANNEL_MESSAGE_UPLOAD]->(cmu)',
                'OPTIONAL MATCH (u:User)-[:HAS_CHANNEL_MESSAGE]->(cm)',
            ],
            return: ['rf', 'r', 'ct', 'cmu', 'cmt', 'cm', 'u'],
            map: { model: 'rf', relationships: [
                { alias: 'r', to: 'room' },
                { alias: 'ct', to: 'roomFileType' },
                { alias: 'u', to: 'user' },
                { alias: 'cmu', to: 'channelMessageUpload' },
                { alias: 'cmt', to: 'channelMessageUploadType' },
                { alias: 'cm', to: 'channelMessage' }
            ]},
            params: { room_uuid }
        }}); 
    }

    async destroy(options = { uuid: null, user: null }) {
        RoomFileServiceValidator.destroy(options);

        const { uuid, user } = options;

        const roomFileInstance = await neodeInstance.model('RoomFile').find(uuid);
        if (!roomFileInstance) throw new ControllerError(404, 'Room file not found');

        const roomFileType = roomFileInstance.get('room_file_type').endNode().properties();
        if (!roomFileType) throw new ControllerError(500, 'Room file type not found');

        const room = roomFileInstance.get('room').endNode().properties();
        if (!room) throw new ControllerError(500, 'Room not found');

        const isMessageUpload = roomFileType.name === 'ChannelMessageUpload';
        const [owner, admin, moderator] = await Promise.all([
            this.isOwner({ uuid, user }),
            RoomPermissionService.isInRoom({ room_uuid: room.uuid, user, role_name: 'Admin' }),
            RoomPermissionService.isInRoom({ room_uuid: room.uuid, user, role_name: 'Moderator' })
        ]);
        if (!owner && !admin && !moderator) {
            throw new ControllerError(403, 'User is not an owner of the file, or an admin or moderator of the room');
        }

        const src = roomFileInstance.properties().src;
        const session = neodeInstance.session();
        session.writeTransaction(async (transaction) => {
            await transaction.run(
                `MATCH (rf:RoomFile { uuid: $uuid }) ` +
                `OPTIONAL MATCH (cmu:ChannelMessageUpload)-[:HAS_ROOM_FILE]->(rf) ` +
                `DETACH DELETE rf, cmu`,
                { uuid }
            );

            const key = storage.parseKey(src);
            await storage.deleteFile(key);
        });
    }

    async isOwner(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'isOwner: No options provided');
        if (!options.uuid) throw new ControllerError(400, 'isOwner: No uuid provided');
        if (!options.user) throw new ControllerError(500, 'isOwner: No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'isOwner: No user.sub provided');

        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        const channelMessageUpload = await neodeInstance.cypher(
            `MATCH (cmu:ChannelMessageUpload)-[:HAS_ROOM_FILE]->(rf:RoomFile { uuid: $uuid }) ` +
            `OPTIONAL MATCH (cm:ChannelMessage)-[:HAS_CHANNEL_MESSAGE_UPLOAD]->(cmu) ` +
            `OPTIONAL MATCH (u:User)-[:HAS_CHANNEL_MESSAGE]->(cm) ` +
            `RETURN cmu, cm, u`, { uuid }
        );

        if (!channelMessageUpload.records.length) return false;
        if (!channelMessageUpload.records[0].get('u')) return false;

        return channelMessageUpload.records[0].get('u').properties.uuid === user_uuid;
    }
};

const service = new RoomFileService();

export default service;
