import ChannelMessageServiceValidator from '../../shared/validators/channel_message_service_validator.js';
import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/channel_message_dto.js';
import ChannelMessage from '../mongoose/models/channel_message.js';
import ChannelMessageType from '../mongoose/models/channel_message_type.js';
import ChannelMessageUpload from '../mongoose/models/channel_message_upload.js';
import ChannelMessageUploadType from '../mongoose/models/channel_message_upload_type.js';
import ChannelWebhookMessage from '../mongoose/models/channel_webhook_message.js';
import Channel from '../mongoose/models/channel.js';
import RoomFile from '../mongoose/models/room_file.js';
import RoomFileType from '../mongoose/models/room_file_type.js';
import User from '../mongoose/models/user.js';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { getUploadType } from '../../shared/utils/file_utils.js';
import { broadcastChannel } from '../../../websocket_server.js';

const storage = new StorageService('channel_message_upload');

class Service {

    /**
     * @function findOne
     * @description Find a channel message by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Object}
     */
    async findOne(options = { uuid: null, user: null }) {
        ChannelMessageServiceValidator.findOne(options);

        const { user, uuid } = options;
        const channelMessage = await ChannelMessage.findOne({ uuid })
            .populate('channel user')
            .populate('channel_message_upload.room_file')
            .populate('channel.channel_webhook')
            .populate('channel.channel_webhook.room_file')

        if (!channelMessage) throw new ControllerError(404, 'Channel message not found');
        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: channelMessage.channel.uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return channelMessage;
    }

    /**
     * @function findAll
     * @description Find all channel messages by channel_uuid
     * @param {Object} options
     * @param {String} options.channel_uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {Number} options.page
     * @param {Number} options.limit
     * @returns {Object}
     */
    async findAll(options = { channel_uuid: null, user: null, page: null, limit: null }) {
        options = ChannelMessageServiceValidator.findAll(options);
        const { channel_uuid, user, page, limit, offset } = options;

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const channel = await Channel.findOne({ uuid: channel_uuid })
            .populate('room')
            .populate('channel_webhook')
            .populate('channel_webhook.room_file');
        if (!channel) throw new ControllerError(404, 'Channel not found');

        const params = { channel: channel._id };
        const total = await Channel.find(params).countDocuments();
        const channelMessages = await ChannelMessage.find(params)
            .populate('channel user')
            .populate('channel_message_upload.room_file')
            .sort({ created_at: -1 })
            .limit(limit || 0)
            .skip((page && limit) ? offset : 0);

        return {
            total,
            data: await Promise.all(channelMessages.map(async (channelMessage) => {
                return dto({
                    ...channelMessage._doc,
                    room: { uuid: channel.room.uuid },
                    channel: { uuid: channel.uuid },
                    ...(channel?.channel_webhook && {
                        channel_webhook: {
                            ...channel.channel_webhook._doc,
                            ...(channel.channel_webhook.room_file && { room_file: channel.channel_webhook.room_file })
                        }
                    }),
                });
            })),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }

    async create(options = { body: null, file: null, user: null }) {
        ChannelMessageServiceValidator.create(options);

        const { body, file, user } = options;
        const { uuid, body: msg, channel_uuid } = body;
        const { sub: user_uuid } = user;

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const [channel, savedUser, channel_message_type] = await Promise.all([
            Channel.findOne({ uuid: channel_uuid }).populate('room'),
            User.findOne({ uuid: user_uuid }),
            ChannelMessageType.findOne({ name: 'User' }),
        ]);

        if (!channel) throw new ControllerError(404, 'Channel not found');
        if (!savedUser) throw new ControllerError(404, 'User not found');
        if (!channel_message_type) throw new ControllerError(500, 'Channel message type not found');
        
        const channelMessage = new ChannelMessage({
            uuid,
            body: msg,
            channel_message_type,
            channel: channel._id,
            user: savedUser._id,
            channel_message_upload: null,
        });

        let room_file = null;
        if (file && file.size > 0) {
            const size = file.size;

            const chUploadTypeName = getUploadType(file);
            const [room_file_type, channel_message_upload_type] = await Promise.all([
                RoomFileType.findOne({ name: 'ChannelMessageUpload' }),
                ChannelMessageUploadType.findOne({ name: chUploadTypeName }),
            ]);

            if (!room_file_type) throw new ControllerError(500, 'Room file type not found');
            if (!channel_message_upload_type) throw new ControllerError(500, 'Channel message upload type not found');

            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid: channel.room.uuid, bytes: size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid: channel.room.uuid, bytes: size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }

            const src = await storage.uploadFile(file, uuid);
            room_file = await new RoomFile({
                uuid: uuidv4(),
                room_file_type,
                src,
                size: size,
                room: channel.room._id,
            }).save();

            channelMessage.channel_message_upload = {
                uuid: uuidv4(),
                channel_message_upload_type,
                room_file: room_file._id,
            };
        }

        await channelMessage.save();

        const result = dto({
            ...channelMessage._doc,
            room: { uuid: channel.room.uuid },
            channel: { uuid: channel.uuid },
            user: savedUser._doc,
            ...(channelMessage.channel_message_upload && {
                channel_message_upload: {
                    ...channelMessage.channel_message_upload._doc,
                    ...(room_file && { room_file }),
                }
            }),
        });

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was created.
          */
        broadcastChannel(`channel-${channel_uuid}`, 'chat_message_created', result);

        return result;
    }

    async update(options = { uuid: null, body: null, user: null }) {
        ChannelMessageServiceValidator.update(options);

        const { uuid, body, user } = options;
        const { body: msg } = body;
        const { sub: user_uuid } = user;

        const channelMessage = await ChannelMessage.findOne({ uuid })
            .populate('channel user')
            .populate('channel_message_upload.room_file')
            .populate('channel.channel_webhook')
            .populate('channel.channel_webhook.room_file')
            .populate('channel.room');
        if (!channelMessage) throw new ControllerError(404, 'Channel message not found');

        const channel_uuid = channelMessage.channel.uuid;
        const isOwner = channelMessage.user?.uuid === user_uuid;

        if (!isOwner &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Moderator' })) &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an owner of the message, or an admin or moderator of the room');
        }

        if (msg) channelMessage.body = msg;

        await channelMessage.save();

        const result = dto({
            ...channelMessage._doc,
            room: { uuid: channelMessage.channel.room.uuid },
            channel: { uuid: channelMessage.channel.uuid },
            ...(channelMessage.user && { user: channelMessage.user._doc }),
            ...(channelMessage.channel_message_upload && {
                channel_message_upload: {
                    ...channelMessage.channel_message_upload._doc,
                    ...(channelMessage.channel_message_upload.room_file && {
                        room_file: channelMessage.channel_message_upload.room_file
                    }),
                }
            }),
        });

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was updated.
          */
        broadcastChannel(`channel-${channel_uuid}`, 'chat_message_updated', result);

        return result;
    }

    async destroy(options = { uuid: null, user: null }) {
        ChannelMessageServiceValidator.destroy(options);

        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        const channelMessage = await ChannelMessage.findOne({ uuid })
            .populate('channel')
            .populate('channel.room')
            .populate('channel_message_upload.room_file');
        if (!channelMessage) throw new ControllerError(404, 'Channel message not found');

        const channel_uuid = channelMessage.channel.uuid;
        const isOwner = channelMessage.user?.uuid === user_uuid;

        if (!isOwner &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Moderator' })) &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an owner of the message, or an admin or moderator of the room');
        }

        if (channelMessage.channel_message_upload) {
            const roomFile = channelMessage.channel_message_upload.room_file;
            if (roomFile) {
                await storage.deleteFile(storage.parseKey(roomFile.src));
                await RoomFile.deleteOne({ _id: roomFile._id });
            }
        }

        await ChannelMessage.deleteOne({ uuid });

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was deleted.
          */
        broadcastChannel(`channel-${channel_uuid}`, 'chat_message_deleted', { uuid });
    }
}

const service = new Service();

export default service;
