import MongodbBaseFindService from './_mongodb_base_find_service.js';
import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/channel_dto.js';
import Channel from '../mongoose/models/channel.js';
import ChannelType from '../mongoose/models/channel_type.js';
import Room from '../mongoose/models/room.js';
import RoomFileType from '../mongoose/models/room_file_type.js';
import RoomFile from '../mongoose/models/room_file.js';
import ChannelWebhook from '../mongoose/models/channel_webhook.js';
import ChannelWebhookMessage from '../mongoose/models/channel_webhook_message.js';
import ChannelMessage from '../mongoose/models/channel_message.js';
import ChannelMessageUpload from '../mongoose/models/channel_message_upload.js';
import RoomJoinSettings from '../mongoose/models/room_join_settings.js';

const storage = new StorageService('channel_avatar');

class Service extends MongodbBaseFindService {
    constructor() {
        super(Channel, dto, 'uuid');
    }

    async findOne(options = { uuid: null, user: null }) {
        const { user, uuid } = options;
        const channel = await super.findOne({ uuid }, (query) => query
            .populate('room')
            .populate('channel_type')
            .populate('room_file')
        );

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: uuid, user, role_name: null }))) {
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

        const room = await Room.findOne({ uuid: room_uuid });
        if (!room) {
            throw new ControllerError(404, 'Room not found');
        }

        return await super.findAll(
            { page, limit, where: { room: room._id } },
            ( query ) => query
                .populate('room_file')
                .populate('channel_type')
                .populate('room')
        );
    }

    async create(options = { body: null, file: null, user: null }) {
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

        await channel.save()
        
        return await this.findOne({ uuid, user });
    }

    async update(options = { uuid: null, body: null, file: null, user: null }) {
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
            const { uuid: room_uuid } = existing.room;
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

        await existing.save();

        return this.findOne({ uuid, user });
    }

    async destroy(options = { uuid: null, user: null }) {
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
