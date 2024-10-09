import MongodbBaseFindService from './_mongodb_base_find_service.js';
import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/channel_webhook_dto.js';
import ChannelWebhook from '../mongoose/models/channel_webhook.js';
import Channel from '../mongoose/models/channel.js';
import Room from '../mongoose/models/room.js';
import RoomFileType from '../mongoose/models/room_file_type.js';
import RoomFile from '../mongoose/models/room_file.js';
import ChannelMessage from '../mongoose/models/channel_message.js';
import ChannelMessageType from '../mongoose/models/channel_message_type.js';
import { broadcastChannel } from '../../../websocket_server.js';
import { v4 as uuidv4 } from 'uuid';

const storage = new StorageService('channel_avatar');

class Service extends MongodbBaseFindService {
    constructor() {
        super(ChannelWebhook, dto, 'uuid');
    }

    async findOne(options = { uuid: null, user: null }) {
        const { user, uuid } = options;
        const webhook = await super.findOne({ uuid }, (query) => query
            .populate('channel')
            .populate('room_file'));

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: webhook.channel.uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return webhook;
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

        return await super.findAll({ page, limit }, (query) => query.populate('room_file'), { room: room._id });
    }

    async create(options={ body: null, file: null, user: null }) {
        const { body, file, user } = options;
        const { uuid, name, description, channel_uuid } = body;

        if (!body) throw new ControllerError(400, 'No body provided');
        if (!uuid) throw new ControllerError(400, 'No UUID provided');
        if (!name) throw new ControllerError(400, 'No name provided');
        if (!description) throw new ControllerError(400, 'No description provided');
        if (!channel_uuid) throw new ControllerError(400, 'No channel_uuid provided');
        if (!user) throw new ControllerError(500, 'No user provided');

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin in the room');
        }

        const channel = await Channel.findOne({ uuid: channel_uuid }).populate('room');
        if (!channel) {
            throw new ControllerError(400, 'Channel does not exist');
        }

        if (await ChannelWebhook.findOne({ uuid })) {
            throw new ControllerError(400, 'Channel webhook with that UUID already exists');
        }

        if (await ChannelWebhook.findOne({ channel: channel._id })) {
            throw new ControllerError(400, 'Channel already has a webhook');
        }

        const channelWebhook = await new ChannelWebhook({
            uuid,
            name,
            description,
            channel: channel._id,
        });

        if (file && file.size > 0) {
            const size = file.size;

            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid: channel.room_uuid, bytes: size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid: channel.room_uuid, bytes: size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }

            const roomFileType = await RoomFileType.findOne({ name: 'ChannelWebhookAvatar' });
            const src = await storage.uploadFile(file, uuid);
            channelWebhook.room_file = await new RoomFile({
                src,
                size,
                room: channel.room._id,
                room_file_type: roomFileType._id,
            }).save();
        }

        return this.dto((await channelWebhook.save()));
    }

    async update(options={ uuid: null, body: null, file: null, user: null }) {
        const { uuid, body, file, user } = options;
        const { name, description } = body;

        if (!uuid) throw new ControllerError(400, 'No uuid provided');
        if (!user) throw new ControllerError(500, 'No user provided');

        const existing = await ChannelWebhook.findOne({ uuid }).populate('channel');
        if (!existing) {
            throw new ControllerError(404, 'Channel Webhook not found');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: existing.channel.uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin in the room');
        }

        if (name) existing.name = name;
        if (description) existing.description = description;

        if (file && file.size > 0) {
            const size = file.size;
            const channel = Channel.findOne({ uuid: existing.channel.uuid }).populate('room');

            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid: existing.room.uuid, bytes: size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid: existing.room.uuid, bytes: size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }
            
            const roomFileType = await RoomFileType.findOne({ name: 'ChannelWebhookAvatar' });
            const src = await storage.uploadFile(file, uuid);
            channelWebhook.room_file = await new RoomFile({
                src,
                size,
                room: channel.room._id,
                room_file_type: roomFileType._id,
            }).save();
        }

        return this.dto((await existing.save()));
    }

    async destroy(options={ uuid: null, user: null }) {
        const { uuid, user } = options;

        if (!uuid) throw new ControllerError(400, 'No uuid provided');
        if (!user) throw new ControllerError(500, 'No user provided');

        const existing = await ChannelWebhook.findOne({ uuid }).populate('channel');
        if (!existing) {
            throw new ControllerError(404, 'Channel Webhook not found');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: existing.channel.uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin in the room');
        }

        await existing.remove();
    }

    async message(options={ uuid: null, body: null }) {
        const { uuid, body } = options;
        const { message } = body;

        if (!uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }
        if (!message) {
            throw new ControllerError(400, 'No message provided');
        }

        const existing = await ChannelWebhook.findOne({ uuid }).populate('channel');
        if (!existing) {
            throw new ControllerError(404, 'Channel Webhook not found');
        }

        const channel_message_uuid = uuidv4();
        const channel_uuid = existing.channel.uuid;
        const channelMessageType = await ChannelMessageType.findOne({ name: 'Webhook' });

        await new ChannelMessage({
            uuid: channel_message_uuid,
            body: message,
            channel_uuid: existing.channel._id,
            user: null,
            channel_webhook: existing._id,
            channel_message_type: channelMessageType._id,
        }).save();
        

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was deleted.
          */
        broadcastChannel(`channel-${channel_uuid}`, 'chat_message_created', { channel_uuid });
    }
}

const service = new Service();

export default service;
