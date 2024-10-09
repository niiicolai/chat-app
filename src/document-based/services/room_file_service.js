import MongodbBaseFindService from './_mongodb_base_find_service.js';
import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/room_file_dto.js';
import RoomFile from '../mongoose/models/room_file.js';
import Room from '../mongoose/models/room.js';
import ChannelMessageUpload from '../mongoose/models/channel_message_upload.js';

const storage = new StorageService('room_file');

class Service extends MongodbBaseFindService {
    constructor() {
        super(RoomFile, dto, 'uuid');
    }

    async findOne(options = { uuid: null, user: null }) {
        const { user, uuid } = options;
        const roomFile = await super.findOne({ uuid }, (query) => query
            .populate('room_file_type')
            .populate('room'));

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid: roomFile.room.uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return roomFile;
    }

    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        const { room_uuid, user, page, limit } = options;

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const room = await Room.findOne({ uuid: room_uuid });
        if (!room) {
            throw new ControllerError(404, 'Room not found');
        }

        return await super.findAll({ page, limit }, (query) => query, { room: room._id });
    }

    async destroy(options = { uuid: null, user: null }) {
        const { uuid, user } = options;

        if (!uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        const existing = await RoomFile.findOne({ uuid })
            .populate('room')
            .populate('room_file_type');
        if (!existing) {
            throw new ControllerError(404, 'Room file not found');
        }

        const isMessageUpload = existing.room_file_type.name === 'MessageUpload';

        if (isMessageUpload &&
            !this.isOwner({ uuid, user }) &&
            !(await RoomPermissionService.isInRoom({ room_uuid: existing.room.uuid, user, role_name: 'Moderator' })) &&
            !(await RoomPermissionService.isInRoom({ room_uuid: existing.room.uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an owner of the file, or an admin or moderator of the room');
        }

        await existing.remove();

        /**
         * Delete the file from storage as well
         */
        const key = storage.parseKey(existing.src);
        storage.deleteFile(key);
    }

    async isOwner(options = { uuid: null, user: null }) {
        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        if (!uuid) throw new ControllerError(400, 'isOwner: No uuid provided');
        if (!user_uuid) throw new ControllerError(500, 'isOwner: No user provided');

        // Find the channel message upload related to the room file with the given uuid
        const channelMessageUpload = await ChannelMessageUpload.findOne({ 'room_file.uuid': uuid }).populate('channel_message');
        if (!channelMessageUpload) throw new ControllerError(404, 'isOwner: Channel message upload not found');

        // Find the channel message related to the channel message upload and populate the user field
        const channelMessage = await ChannelMessage.findOne({ uuid: channelMessageUpload.channel_message.uuid }).populate('user');
        if (!channelMessage) throw new ControllerError(404, 'isOwner: Channel message not found');

        return channelMessage.user.uuid === user_uuid;
    }
};

const service = new Service();

export default service;
