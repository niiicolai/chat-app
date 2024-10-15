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
import ChannelWebhookMessage from '../mongoose/models/channel_webhook_message.js';
import ChannelWebhookMessageType from '../mongoose/models/channel_webhook_message_type.js';
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
        let { room_uuid, user, page, limit } = options;

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const room = await Room.findOne({ uuid: room_uuid });
        if (!room) {
            throw new ControllerError(404, 'Room not found');
        }

        if (page && isNaN(page)) throw new ControllerError(400, 'page must be a number');
        if (page && page < 1) throw new ControllerError(400, 'page must be greater than 0');
        if (limit && limit < 1) throw new ControllerError(400, 'limit must be greater than 0');
        if (limit && isNaN(limit)) throw new ControllerError(400, 'limit must be a number');
        if (page && !limit) throw new ControllerError(400, 'page requires limit');

        const channels = await Channel.find({ room: room._id });
        const channelIds = channels.map(channel => channel._id);
        
        let query = ChannelWebhook.find({ channel: { $in: channelIds } })
            .populate('room_file')
            .populate('channel')
            .sort({ created_at: -1 });

        const result = {};

        if (limit) {
            limit = parseInt(limit);
            query = query.limit(limit);
            result.limit = limit
        }

        if (page && !isNaN(page) && limit) {
            page = parseInt(page);
            const offset = ((page - 1) * limit);
            query = query.skip(offset);
            result.page = page;
        }

        query = await query.exec();

        result.data = query.map((m) => this.dto(m));
        result.total = await ChannelWebhook.countDocuments({ channel: { $in: channelIds } });

        if (page && !isNaN(page) && limit) {
            result.pages = Math.ceil(result.total / limit);
        }

        return result;
    }

    async create(options = { body: null, file: null, user: null }) {
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

        const channelWebhook = new ChannelWebhook({
            uuid,
            name,
            description,
            channel: channel._id,
        });

        if (file && file.size > 0) {
            const size = file.size;

            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid: channel.room.uuid, bytes: size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid: channel.room.uuid, bytes: size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }

            const roomFileType = await RoomFileType.findOne({ name: 'ChannelWebhookAvatar' });
            const src = await storage.uploadFile(file, uuid);
            channelWebhook.room_file = await new RoomFile({
                uuid: uuidv4(),
                src,
                size,
                room: channel.room._id,
                room_file_type: roomFileType._id,
            }).save();
        }

        return this.dto((await channelWebhook.save()));
    }

    async update(options = { uuid: null, body: null, file: null, user: null }) {
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
            const channel = await Channel.findOne({ uuid: existing.channel.uuid }).populate('room');
            const room_uuid = channel.room.uuid;

            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid, bytes: size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid, bytes: size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }

            const roomFileType = await RoomFileType.findOne({ name: 'ChannelWebhookAvatar' });
            const src = await storage.uploadFile(file, uuid);
            existing.room_file = await new RoomFile({
                uuid: uuidv4(),
                src,
                size,
                room: channel.room._id,
                room_file_type: roomFileType._id,
            }).save();
        }

        return this.dto((await existing.save()));
    }

    async destroy(options = { uuid: null, user: null }) {
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
        const channelMessages = await ChannelMessage.find({ channel: existing.channel._id })
            .populate('channel_webhook_message');
        const channelMessagesWithWebhookMessage = channelMessages.filter(channelMessage => channelMessage.channel_webhook_message);
        const channelMessageIds = channelMessagesWithWebhookMessage.map(channelMessage => channelMessage._id);

        await ChannelMessage.deleteMany({ _id: { $in: channelMessageIds } });
        await ChannelWebhookMessage.deleteMany({ channel_webhook: existing._id });
        await ChannelWebhook.deleteOne({ uuid });
    }

    async message(options = { uuid: null, body: null }) {
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

        const channelMessageType = await ChannelMessageType.findOne({ name: 'Webhook' });
        if (!channelMessageType) {
            throw new ControllerError(500, 'Channel Message Type not found');
        }

        const channelWebhookMessageType = await ChannelWebhookMessageType.findOne({ name: 'Custom' });
        if (!channelWebhookMessageType) {
            throw new ControllerError(500, 'Channel Webhook Message Type not found');
        }

        const channelWebhookMessage = await new ChannelWebhookMessage({
            uuid: uuidv4(),
            body: message,
            channel_webhook_message_type: channelWebhookMessageType._id,
            channel_webhook: existing._id,
        }).save();

        await new ChannelMessage({
            uuid: uuidv4(),
            body: message,
            channel: existing.channel._id,
            user: null,
            channel_message_type: channelMessageType._id,
            channel_webhook_message: channelWebhookMessage._id,
        }).save();


        const channel_uuid = existing.channel.uuid;

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was deleted.
          */
        broadcastChannel(`channel-${channel_uuid}`, 'chat_message_created', { channel_uuid });
    }
}

const service = new Service();

export default service;
