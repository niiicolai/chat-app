import Validator from '../../shared/validators/channel_webhook_service_validator.js';
import BroadcastChannelService from '../../shared/services/broadcast_channel_service.js';
import err from '../../shared/errors/index.js';
import StorageService from '../../shared/services/storage_service.js';
import RPS from './room_permission_service.js';
import dto from '../dto/channel_webhook_dto.js';
import mongoose from '../mongoose/index.js';
import chatMessageDto from '../dto/channel_message_dto.js';
import Channel from '../mongoose/models/channel.js';
import Room from '../mongoose/models/room.js';
import RoomFile from '../mongoose/models/room_file.js';
import ChannelMessage from '../mongoose/models/channel_message.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @constant storage
 * @description Storage service instance
 * @type {StorageService}
 */
const storage = new StorageService('channel_avatar');

/**
 * @class ChannelWebhookService
 * @description Service class for channel webhooks.
 * @exports ChannelWebhookService
 */
class ChannelWebhookService {

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
        Validator.findOne(options);

        const { uuid, user } = options;
        const channel = await Channel
            .findOne({ 'channel_webhook._id': uuid })
            .populate('room channel_webhook.room_file');
        const channelWebhook = channel?.channel_webhook;
        
        if (!channelWebhook) throw new err.EntityNotFoundError('channel_webhook');

        const channel_uuid = channel._id;
        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto({ ...channelWebhook._doc });
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
        options = Validator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        const room = await Room.findOne({ _id: room_uuid });
        if (!room) throw new err.EntityNotFoundError('room');

        const isInRoom = await RPS.isInRoom({ room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const params = { room: room_uuid, channel_webhook: { $exists: true } };
        const [total, data] = await Promise.all([
            Channel.find(params).countDocuments(),
            Channel.find(params)
                .populate('room channel_webhook.room_file')
                .sort({ created_at: -1 })
                .limit(limit || 0)
                .skip((page && limit) ? offset : 0)
                .then(channels => channels.filter(channel => channel.channel_webhook))
                .then(channels => channels.map(channel => dto({
                    ...channel.channel_webhook._doc,
                    channel: channel._doc,
                    room: channel.room._doc,
                }))),
        ]);

        return {
            total,
            data,
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
        Validator.create(options);

        const { body, file, user } = options;
        const { uuid, name, description, channel_uuid } = body;

        const channel = await Channel.findOne({ _id: channel_uuid }).populate('room');
        if (!channel) throw new err.EntityNotFoundError('channel');

        const isAdmin = await RPS.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const uuidExists = await Channel.findOne({ 'channel_webhook._id': uuid });
        if (uuidExists) throw new err.DuplicateEntryError('channel_webhook', 'PRIMARY', uuid);

        if (channel.channel_webhook) {
            throw new err.DuplicateEntryError('channel_webhook', 'channel_uuid', channel_uuid);
        }    

        const room_uuid = channel.room._id;
        const avatar_src = await this.createAvatar({ uuid, room_uuid, file });

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const roomFileUuid = (avatar_src ? uuidv4() : null);
            if (avatar_src) {                
                await RoomFile.insertMany([{
                    _id: roomFileUuid,
                    src: avatar_src,
                    size: file.size,
                    room_file_type: "ChannelWebhookAvatar",
                    room: channel.room._id,
                }], { session });
            }
            
            await Channel.updateOne(
                { _id: channel._id },
                { channel_webhook: {
                    _id: uuid,
                    name,
                    description,
                    ...(avatar_src && { room_file: roomFileUuid }),
                } },
                { session }
            );

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            // Delete the avatar file if it was uploaded
            if (avatar_src) storage.deleteFile(storage.parseKey(avatar_src));
            console.error(error);
            throw error;
        } finally {
            session.endSession();
        }

        const updatedChannel = await Channel.findOne({ _id: channel_uuid })
            .populate('room channel_webhook.room_file');

        return dto({ 
            ...updatedChannel.channel_webhook._doc, 
            channel: updatedChannel._doc,
            room: updatedChannel.room._doc,
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
        Validator.update(options);

        const { uuid, body, file, user } = options;
        const { name, description } = body;

        const channel = await Channel.findOne({ 'channel_webhook._id': uuid })
                .populate('room channel_webhook.room_file');
        const channelWebhook = channel?.channel_webhook;

        if (!channelWebhook) throw new err.EntityNotFoundError('channel_webhook');

        const channel_uuid = channel._id;
        const isAdmin = await RPS.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const room_uuid = channel.room._id;
        const avatar_src = await this.createAvatar({ uuid, room_uuid, file });
        
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const newRoomFileUuid = (avatar_src ? uuidv4() : null);
            const oldRoomFile = channelWebhook.room_file;
            if (avatar_src) {                
                await RoomFile.insertMany([{
                    _id: newRoomFileUuid,
                    src: avatar_src,
                    size: file.size,
                    room_file_type: "ChannelWebhookAvatar",
                    room: channel.room._id,
                }], { session });
            }
            
            await Channel.updateOne(
                { _id: channel._id },
                { channel_webhook: {
                    _id: uuid,
                    name: name || channelWebhook.name,
                    description: description || channelWebhook.description,
                    room_file: newRoomFileUuid || channelWebhook.room_file,
                } },
                { session }
            );

            if (avatar_src && oldRoomFile) {
                await RoomFile.deleteOne({ _id: oldRoomFile._id }, { session });
                await storage.deleteFile(storage.parseKey(oldRoomFile.src));
            }

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            // Delete the avatar file if it was uploaded
            if (avatar_src) storage.deleteFile(storage.parseKey(avatar_src));
            console.error(error);
            throw error;
        } finally {
            session.endSession();
        }
        
        const updatedChannel = await Channel.findOne({ 'channel_webhook._id': uuid })
                .populate('room channel_webhook.room_file');

        return dto({ 
            ...updatedChannel.channel_webhook._doc, 
            channel: updatedChannel._doc,
            room: updatedChannel.room._doc,
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
        Validator.destroy(options);

        const { uuid, user } = options;

        const channel = await Channel.findOne({ 'channel_webhook._id': uuid })
                .populate('room channel_webhook.room_file');
        const channelWebhook = channel?.channel_webhook;

        if (!channelWebhook) throw new err.EntityNotFoundError('channel_webhook');

        const channel_uuid = channel._id;
        const isAdmin = await RPS.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            await ChannelMessage.deleteMany(
                { channel_webhook_message: { channel_webhook: channelWebhook._id } },
                { session }
            );
            
            await Channel.updateOne(
                { _id: channel._id },
                { $unset: { channel_webhook: "" } },
                { session }
            );

            if (channelWebhook.room_file) {
                await RoomFile.deleteOne({ _id: channelWebhook.room_file._id }, { session });
                await storage.deleteFile(storage.parseKey(channelWebhook.room_file.src));
            }

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            console.error(JSON.stringify(error));
            throw error;
        } finally {
            session.endSession();
        }
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
        Validator.message(options);

        const { uuid, body } = options;
        const { message } = body;

        const channel = await Channel.findOne({ 'channel_webhook._id': uuid });
        const channelWebhook = channel?.channel_webhook;

        if (!channelWebhook) throw new err.EntityNotFoundError('channel_webhook');

        const chatMessage = await new ChannelMessage({
            _id: uuidv4(),
            body: message,
            user: null,
            channel_message_type: "Webhook",
            channel: channel._id,
            channel_webhook_message: {
                _id: uuidv4(),
                body: message,
                channel_webhook_message_type: "Custom",
                channel_webhook: channelWebhook._id,
            },
        }).save();

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was deleted.
          */
        BroadcastChannelService.create(chatMessageDto({ 
            ...chatMessage._doc,
            channel: channel._doc,
            channel_webhook: channelWebhook._doc,
        }));
    }

    /**
     * @function createAvatar
     * @description Create a channel webhook avatar (helper function)
     * @param {Object} options
     * @param {String} options.uuid
     * @param {String} options.room_uuid
     * @param {Object} options.file
     * @returns {Promise<String | null>}
     */
    async createAvatar(options = { uuid: null, room_uuid: null, file: null }) {
        if (!options) throw new Error('createAvatar: options is required');
        if (!options.uuid) throw new Error('createAvatar: options.uuid is required');
        if (!options.room_uuid) throw new Error('createAvatar: options.room_uuid is required');

        const { uuid, room_uuid, file } = options;

        if (file && file.size > 0) {
            const [singleLimit, totalLimit] = await Promise.all([
                RPS.fileExceedsSingleFileSize({ room_uuid, bytes: file.size }),
                RPS.fileExceedsTotalFilesLimit({ room_uuid, bytes: file.size }),
            ]);

            if (totalLimit) throw new err.ExceedsRoomTotalFilesLimitError();
            if (singleLimit) throw new err.ExceedsSingleFileSizeError();

            return await storage.uploadFile(file, uuid);
        }

        return null;
    }
}

const service = new ChannelWebhookService();

export default service;
