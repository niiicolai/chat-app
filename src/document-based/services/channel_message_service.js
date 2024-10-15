import MongodbBaseFindService from './_mongodb_base_find_service.js';
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

class Service extends MongodbBaseFindService {
    constructor() {
        super(ChannelMessage, dto, 'uuid');
    }

    async findOne(options = { uuid: null, user: null }) {
        const { user, uuid } = options;
        const msg = await super.findOne({ uuid }, (query) => query
            .populate('channel_message_type')
            .populate('user')
            .populate('channel')
            .populate({
                path: 'channel_message_upload',
                populate: [
                    { path: 'room_file', model: 'RoomFile' },
                    { path: 'channel_message_upload_type', model: 'ChannelMessageUploadType' }
                ]
            })
        );

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: msg.channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return msg;
    }

    async findAll(options = { channel_uuid: null, user: null, page: null, limit: null }) {
        const { channel_uuid, user, page, limit } = options;

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!channel_uuid) {
            throw new ControllerError(400, 'No channel_uuid provided');
        }

        const channel = await Channel.findOne({ uuid: channel_uuid });
        if (!channel) {
            throw new ControllerError(404, 'Channel not found');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return await super.findAll(
            { page, limit, where: { channel: channel._id } },
            (query) => query
                .populate('channel_message_type')
                .populate('user')
                .populate('channel')
                .populate({
                    path: 'channel_message_upload',
                    populate: [
                        { path: 'room_file', model: 'RoomFile' },
                        { path: 'channel_message_upload_type', model: 'ChannelMessageUploadType' }
                    ]
                })
                .populate({
                    path: 'channel_webhook_message',
                    populate: [
                        { path: 'channel_webhook_message_type', model: 'ChannelWebhookMessageType' },
                        { path: 'channel_webhook', model: 'ChannelWebhook', populate: [
                            { path: 'room_file', model: 'RoomFile' }
                        ]},
                    ]
                })
        );
    }

    async create(options = { body: null, file: null, user: null }) {
        const { body, file, user } = options;
        const { uuid, body: msg, channel_uuid } = body;
        const { sub: user_uuid } = user;

        if (!body) throw new ControllerError(400, 'No body provided');
        if (!uuid) throw new ControllerError(400, 'No UUID provided');
        if (!msg) throw new ControllerError(400, 'No body.body provided');
        if (!channel_uuid) throw new ControllerError(400, 'No channel_uuid provided');
        if (!user) throw new ControllerError(500, 'No user provided');

        const channel = await Channel.findOne({ uuid: channel_uuid }).populate('room');
        if (!channel) {
            throw new ControllerError(404, 'Channel not found');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const savedUser = await User.findOne({ uuid: user_uuid });
        const channelMessageType = await ChannelMessageType.findOne({ name: 'User' });
        const channelMessage = new ChannelMessage({
            uuid,
            body: msg,
            channel: channel._id,
            channel_message_type: channelMessageType._id,
            user: savedUser._id,
            channel_message_upload: null,
        });


        if (file && file.size > 0) {
            const size = file.size;

            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid: channel.room.uuid, bytes: size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid: channel.room.uuid, bytes: size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }

            const roomFileType = await RoomFileType.findOne({ name: 'ChannelMessageUpload' });
            const src = await storage.uploadFile(file, uuid);
            const roomFile = await new RoomFile({
                uuid: uuidv4(),
                room_file_type: roomFileType._id,
                src,
                size: size,
                room: channel.room._id,
            }).save();

            const chUploadTypeName = getUploadType(file);
            const chUploadType = await ChannelMessageUploadType.findOne({ name: chUploadTypeName });
            const chUpload = await new ChannelMessageUpload({
                uuid: uuidv4(),
                channel_message_upload_type: chUploadType._id,
                room_file: roomFile._id,
            }).save();

            channelMessage.channel_message_upload = chUpload._id;
        }

        await channelMessage.save();

        const result = this.findOne({ uuid, user });

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was created.
          */
        broadcastChannel(`channel-${channel_uuid}`, 'chat_message_created', result);

        return result;
    }

    async update(options = { uuid: null, body: null, user: null }) {
        const { uuid, body, user } = options;
        const { body: msg } = body;
        const { sub: user_uuid } = user;

        if (!body) throw new ControllerError(400, 'No body provided');
        if (!uuid) throw new ControllerError(400, 'No uuid provided');
        if (!user) throw new ControllerError(500, 'No user provided');

        const existing = await ChannelMessage.findOne({ uuid }).populate('channel');
        if (!existing) {
            throw new ControllerError(404, 'Channel message not found');
        }

        const channel_uuid = existing.channel.uuid;
        const isOwner = existing.user?.uuid === user_uuid;

        if (!isOwner &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Moderator' })) &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an owner of the message, or an admin or moderator of the room');
        }

        if (msg) existing.body = msg;

        await existing.save();

        const result = this.findOne({ uuid, user });

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was updated.
          */
        broadcastChannel(`channel-${channel_uuid}`, 'chat_message_updated', result);

        return result;
    }

    async destroy(options = { uuid: null, user: null }) {
        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        if (!uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }
        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        const existing = await ChannelMessage.findOne({ uuid })
            .populate('channel_message_type')
            .populate('user')
            .populate('channel')
            .populate('channel_webhook_message')
            .populate({
                path: 'channel_message_upload',
                populate: [
                    { path: 'room_file', model: 'RoomFile' },
                    { path: 'channel_message_upload_type', model: 'ChannelMessageUploadType' }
                ]
            });
            
        if (!existing) {
            throw new ControllerError(404, 'Channel message not found');
        }

        const channel_uuid = existing.channel.uuid;
        const isOwner = existing.user?.uuid === user_uuid;

        if (!isOwner &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Moderator' })) &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an owner of the message, or an admin or moderator of the room');
        }

        if (existing.channel_message_upload) {
            const roomFile = await RoomFile.findOne({ _id: existing.channel_message_upload.room_file });
            if (roomFile) {
                await storage.deleteFile(storage.parseKey(roomFile.src));
                await RoomFile.deleteOne({ _id: roomFile._id });
            }
            await ChannelMessageUpload.deleteOne({ _id: existing.channel_message_upload._id });
        }

        if (existing.channel_webhook_message) {
            await ChannelWebhookMessage.deleteOne({ _id: existing.channel_webhook_message._id });
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
