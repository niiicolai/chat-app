import ChannelWebhookServiceValidator from '../../shared/validators/channel_webhook_service_validator.js';
import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/channel_webhook_dto.js';
import chatMessageDto from '../dto/channel_message_dto.js';
import ChannelWebhook from '../mongoose/models/channel_webhook.js';
import Channel from '../mongoose/models/channel.js';
import Room from '../mongoose/models/room.js';
import RoomFileType from '../mongoose/models/room_file_type.js';
import RoomFile from '../mongoose/models/room_file.js';
import ChannelMessage from '../mongoose/models/channel_message.js';
import ChannelMessageType from '../mongoose/models/channel_message_type.js';
import ChannelWebhookMessageType from '../mongoose/models/channel_webhook_message_type.js';
import { broadcastChannel } from '../../../websocket_server.js';
import { v4 as uuidv4 } from 'uuid';

const storage = new StorageService('channel_avatar');

class Service {

    /**
     * @function findOne
     * @description Find a channel webhook by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Object}
     */
    async findOne(options = { uuid: null, user: null }) {
        ChannelWebhookServiceValidator.findOne(options);

        const channel = await Channel.findOne({ channel_webhook: { uuid: options.uuid } })
            .populate('room channel_webhook.room_file');
        const channelWebhook = channel?.channel_webhook;

        if (!channel) throw new ControllerError(404, 'Channel not found');
        if (!channelWebhook) throw new ControllerError(404, 'Channel Webhook not found');

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: channel.uuid, user: options.user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return dto({
            ...channelWebhook._doc,
            room_file: channelWebhook.room_file?._doc,
            room: { uuid: channel.room.uuid },
            channel: { uuid: channel.uuid }
        });
    }

    /**
     * @function findAll
     * @description Find all channel webhooks by room_uuid
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {Number} options.page
     * @param {Number} options.limit
     * @returns {Object}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = ChannelWebhookServiceValidator.findAll(options);
        const { room_uuid, user, page, limit, offset } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const room = await Room.findOne({ uuid: room_uuid });
        if (!room) throw new ControllerError(404, 'Room not found');

        const params = { room: room._id, channel_webhook: { $exists: true } };
        const total = await Channel.find(params).countDocuments();
        const channels = await Channel.find(params)
            .populate('room channel_webhook.room_file')
            .sort({ created_at: -1 })
            .limit(limit || 0)
            .skip((page && limit) ? offset : 0);

        return {
            total,
            data: await Promise.all(channels.map(async (channel) => {
                return dto({ 
                    ...channel.channel_webhook._doc, 
                    room_file: channel.channel_webhook.room_file?._doc,
                    room: { uuid: room_uuid },
                    channel: { uuid: channel.uuid }
                });
            })),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }

    /**
     * @function create
     * @description Create a channel webhook
     * @param {Object} options
     * @param {Object} options.body
     * @param {String} options.body.uuid
     * @param {String} options.body.name
     * @param {String} options.body.description
     * @param {String} options.body.channel_uuid
     * @param {Object} options.file
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Object}
     */
    async create(options = { body: null, file: null, user: null }) {
        ChannelWebhookServiceValidator.create(options);

        const { body, file, user } = options;
        const { uuid, name, description, channel_uuid } = body;

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin in the room');
        }

        if (await Channel.findOne({ channel_webhook: { uuid } })) {
            throw new ControllerError(400, 'Channel webhook with that UUID already exists');
        }

        const channel = await Channel.findOne({ uuid: channel_uuid }).populate('room');
        if (!channel) throw new ControllerError(400, 'Channel does not exist');
        if (channel.channel_webhook) throw new ControllerError(400, 'Channel already has a webhook');

        const channel_webhook = {
            uuid,
            name,
            description,
            room_file: null,
        }

        let room_file = null;
        if (file && file.size > 0) {
            const size = file.size;
            const room_file_type = await RoomFileType.findOne({ name: 'ChannelWebhookAvatar' });
            if (!room_file_type) throw new ControllerError(500, 'Room File Type not found');

            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid: channel.room.uuid, bytes: size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid: channel.room.uuid, bytes: size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }
            
            const src = await storage.uploadFile(file, uuid);
            room_file = await new RoomFile({
                uuid: uuidv4(),
                src,
                size,
                room_file_type,
                room: channel.room._id,
            }).save();
            channel_webhook.room_file = room_file._id;
        }

        channel.channel_webhook = channel_webhook;
        await channel.save();

        return dto({ 
            ...channel_webhook, 
            room_file: room_file?._doc, 
            channel: { uuid: channel.uuid }, 
            room: { uuid: channel.room.uuid } 
        });
    }

    /**
     * @function update
     * @description Update a channel webhook
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.body
     * @param {String} options.body.name
     * @param {String} options.body.description
     * @param {Object} options.file
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Object}
     */
    async update(options = { uuid: null, body: null, file: null, user: null }) {
        ChannelWebhookServiceValidator.update(options);

        const { uuid, body, file, user } = options;
        const { name, description } = body;

        const channel = await Channel.findOne({ 'channel_webhook.uuid': uuid }).populate('room');
        const channelWebhook = channel?.channel_webhook;

        if (!channel) throw new ControllerError(404, 'Channel not found');
        if (!channelWebhook) throw new ControllerError(404, 'Channel Webhook not found');
        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: channel.uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin in the room');
        }

        if (name) channelWebhook.name = name;
        if (description) channelWebhook.description = description;

        let room_file = null;
        if (file && file.size > 0) {
            const size = file.size;
            const room_uuid = channel.room.uuid;
            const room_file_type = await RoomFileType.findOne({ name: 'ChannelWebhookAvatar' });
            if (!room_file_type) throw new ControllerError(500, 'Room File Type not found');

            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid, bytes: size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid, bytes: size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }

            const src = await storage.uploadFile(file, uuid);
            room_file = await new RoomFile({
                uuid: uuidv4(),
                src,
                size,
                room_file_type,
                room: channel.room._id,
            }).save();
            channelWebhook.room_file = room_file._id;
        }

        await channel.save();

        return dto({ 
            ...channelWebhook._doc, 
            room_file: room_file?._doc, 
            channel: { uuid: channel.uuid },
            room: { uuid: channel.room.uuid } 
        });
    }

    /**
     * @function destroy
     * @description Destroy a channel webhook by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {void}
     */
    async destroy(options = { uuid: null, user: null }) {
        ChannelWebhookServiceValidator.destroy(options);

        const { uuid, user } = options;
        const channel = await Channel.findOne({ 'channel_webhook.uuid': uuid }).populate('room channel_webhook.room_file');
        const channelWebhook = channel?.channel_webhook;

        if (!channel) throw new ControllerError(404, 'Channel not found');
        if (!channelWebhook) throw new ControllerError(404, 'Channel Webhook not found');

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: channel.uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin in the room');
        }

        if (channelWebhook.room_file) {
            await Promise.all([
                RoomFile.deleteOne({ _id: channelWebhook.room_file._id }),
                storage.deleteFile(storage.parseKey(channelWebhook.room_file.src))
            ]);
        }

        channel.channel_webhook = null;

        await Promise.all([
            ChannelMessage.deleteMany({ channel_webhook_message: { channel_webhook: channelWebhook._id } }),
            channel.save()
        ]);
    }

    /**
     * @function message
     * @description Send a message to a channel webhook
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.body
     * @param {String} options.body.message
     * @returns {void}
     */
    async message(options = { uuid: null, body: null }) {
        ChannelWebhookServiceValidator.message(options);

        const { uuid, body } = options;
        const { message } = body;

        const [channel, channel_message_type, channel_webhook_message_type] = await Promise.all([
            Channel.findOne({ 'channel_webhook.uuid': uuid }).populate('room channel_webhook.room_file'),
            ChannelMessageType.findOne({ name: 'Webhook' }),
            ChannelWebhookMessageType.findOne({ name: 'Custom' }),
        ]);

        const channelWebhook = channel?.channel_webhook;

        if (!channel) throw new ControllerError(404, 'Channel not found');
        if (!channelWebhook) throw new ControllerError(404, 'Channel Webhook not found');
        if (!channel_message_type) throw new ControllerError(500, 'Channel Message Type not found');
        if (!channel_webhook_message_type) throw new ControllerError(500, 'Channel Webhook Message Type not found');

        const chatMessage = await new ChannelMessage({
            uuid: uuidv4(),
            body: message,
            user: null,
            channel_message_type,
            channel: channel._id,
            channel_webhook_message: {
                uuid: uuidv4(),
                body: message,
                channel_webhook_message_type,
                channel_webhook: channelWebhook._id,
            },
        }).save();

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was deleted.
          */
        broadcastChannel(`channel-${channel.uuid}`, 'chat_message_created', chatMessageDto({ 
            ...chatMessage._doc,
            channel: { uuid: channel.uuid },
            channel_webhook_message: chatMessage.channel_webhook_message?._doc,
            channel_webhook: {
                ...channelWebhook._doc,
                ...(channelWebhook.room_file && { room_file: channelWebhook.room_file._doc })
            },
        }));
    }
}

const service = new Service();

export default service;
