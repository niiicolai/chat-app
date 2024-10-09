import MongodbBaseFindService from './_mongodb_base_find_service.js';
import ControllerError from '../../errors/controller_error.js';
import StorageService from '../../services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/channel_dto.js';
import Channel from '../../../mongoose/models/channel.js';
import ChannelType from '../../../mongoose/models/channel_type.js';
import Room from '../../../mongoose/models/room.js';
import RoomFileType from '../../../mongoose/models/room_file_type.js';
import RoomFile from '../../../mongoose/models/room_file.js';

const storage = new StorageService('channel_avatar');

class Service extends MongodbBaseFindService {
    constructor() {
        super(Channel, dto, 'uuid');
    }

    async findOne(options = { uuid: null, user: null }) {
        const { user, uuid } = options;
        const channel = await super.findOne({ uuid });

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: channel.uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return channel;
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

        return await super.findAll({ page, limit }, (query) => query.populate('room_file'), { room_uuid });
    }

    async create(options={ body: null, file: null, user: null }) {
        const { body, file, user } = options;
        const { uuid, name, description, channel_type_name, room_uuid } = body;

        if (!body) throw new ControllerError(400, 'No body provided');
        if (!uuid) throw new ControllerError(400, 'No UUID provided');
        if (!name) throw new ControllerError(400, 'No name provided');
        if (!description) throw new ControllerError(400, 'No description provided');
        if (!channel_type_name) throw new ControllerError(400, 'No channel_type_name provided');
        if (!room_uuid) throw new ControllerError(400, 'No room_uuid provided');
        if (!user) throw new ControllerError(500, 'No user provided');

        const room = await Room.findOne({ uuid: room_uuid });
        if (!room) {
            throw new ControllerError(404, 'Room not found');
        }

        const channelType = await ChannelType.findOne({ name: channel_type_name });
        if (!channelType) {
            throw new ControllerError(404, 'Channel type not found');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        if (await RoomPermissionService.channelCountExceedsLimit({ room_uuid, add_count: 1 })) {
            throw new ControllerError(400, 'Room channel count exceeds limit. The room cannot have more channels');
        }

        if (await Channel.findOne({ channel_uuid: uuid })) {
            throw new ControllerError(400, 'Channel with that UUID already exists');
        }

        if (await Channel.findOne({ channel_name: name, channel_type: channelType._id, room: room._id })) {
            throw new ControllerError(400, 'Channel with that name and type already exists in the room');
        }

        const channel = await new Channel({
            uuid,
            name,
            description,
            channel_type: channelType._id,
            room: room._id,
        });

        if (file && file.size > 0) {
            const size = file.size;

            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid, bytes: size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid, bytes: size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }

            const roomFileType = await RoomFileType.findOne({ name: 'ChannelAvatar' });
            const src = await storage.uploadFile(file, uuid);
            const roomFile = await new RoomFile({
                uuid,
                room_file_type: roomFileType._id,
                src: src,
                size: size,
                room: room._id,
            }).save();

            channel.room_file = roomFile._id;
        }

        return this.dto((await channel.save()));
    }

    async update(options={ uuid: null, body: null, file: null, user: null }) {
        const { uuid, body, file, user } = options;
        const { name, description } = body;

        if (!uuid) throw new ControllerError(400, 'No uuid provided');
        if (!user) throw new ControllerError(500, 'No user provided');

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        const existing = await Channel.findOne({ uuid }).populate('room');
        if (!existing) {
            throw new ControllerError(404, 'Channel not found');
        }

        if (name) existing.name = name;
        if (description) existing.description = description;
        
        if (file && file.size > 0) {
            const { room_uuid } = existing.room;
            const { size } = file;

            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid, bytes: size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid, bytes: size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }

            const roomFileType = await RoomFileType.findOne({ name: 'ChannelAvatar' });
            const src = await storage.uploadFile(file, uuid);
            const roomFile = await new RoomFile({
                uuid,
                room_file_type: roomFileType._id,
                src: src,
                size: size,
                room: existing.room._id,
            }).save();

            existing.room_file = roomFile._id;
        }

        return this.dto((await existing.save()));
    }

    async destroy(options={ uuid: null, user: null }) {
        const { uuid, user } = options;

        if (!uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }
        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        const channel = await Channel.findOne({ uuid });
        if (!channel) {
            throw new ControllerError(404, 'Channel not found');
        }

        await channel.remove();
    }
}

const service = new Service();

export default service;
