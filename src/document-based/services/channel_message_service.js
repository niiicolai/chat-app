import Validator from '../../shared/validators/channel_message_service_validator.js';
import err from '../../shared/errors/index.js';
import BroadcastChannelService from '../../shared/services/broadcast_channel_service.js';
import StorageService from '../../shared/services/storage_service.js';
import RPS from './room_permission_service.js';
import dto from '../dto/channel_message_dto.js';
import ChannelMessage from '../mongoose/models/channel_message.js';
import ChannelMessageType from '../mongoose/models/channel_message_type.js';
import ChannelMessageUploadType from '../mongoose/models/channel_message_upload_type.js';
import Channel from '../mongoose/models/channel.js';
import RoomFile from '../mongoose/models/room_file.js';
import RoomFileType from '../mongoose/models/room_file_type.js';
import User from '../mongoose/models/user.js';
import mongoose from '../mongoose/index.js';
import { v4 as uuidv4 } from 'uuid';
import { getUploadType } from '../../shared/utils/file_utils.js';

/**
 * @constant {storage}
 * @description Storage service instance
 * @private
 */
const storage = new StorageService('channel_message_upload');

/**
 * @class ChannelMessageService
 * @description Service class for channel messages.
 * @exports ChannelMessageService
 */
class ChannelMessageService {

    /**
     * @function findOne
     * @description Find a channel message by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const { user, uuid } = options;
        const channelMessage = await ChannelMessage.findOne({ _id: uuid })
            .populate('channel user')
            .populate('channel_message_upload.room_file')
            .populate('channel.channel_webhook')
            .populate('channel.channel_webhook.room_file')

        if (!channelMessage) throw new err.EntityNotFoundError('channel_message');

        const channel_uuid = channelMessage.channel._id;
        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto({
            ...channelMessage._doc,
            room: channelMessage.channel.room._doc,
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
     * @returns {Promise<Object>}
     */
    async findAll(options = { channel_uuid: null, user: null, page: null, limit: null }) {
        options = Validator.findAll(options);

        const { channel_uuid, user, page, limit, offset } = options;

        const channel = await Channel.findOne({ _id: channel_uuid })
            .populate('room')
            .populate('channel_webhook')
            .populate('channel_webhook.room_file');
        if (!channel) throw new err.EntityNotFoundError('channel');

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const params = { channel: channel._id };
        const [total, channelMessages] = await Promise.all([
            ChannelMessage.find(params).countDocuments(),
            ChannelMessage.find(params)
                .populate('channel user')
                .populate('channel_message_upload.room_file')
                .sort({ created_at: -1 })
                .limit(limit || 0)
                .skip((page && limit) ? offset : 0),
        ]);

        return {
            total,
            data: channelMessages.map((channelMessage) => {
                return dto({
                    ...channelMessage._doc,
                    room: channel.room._doc,
                    ...(channel?.channel_webhook && {
                        channel_webhook: {
                            ...channel.channel_webhook._doc,
                            ...(channel.channel_webhook.room_file && { room_file: channel.channel_webhook.room_file })
                        }
                    }),
                });
            }),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }

    /**
     * @function create
     * @description Create a channel message
     * @param {Object} options
     * @param {Object} options.body
     * @param {String} options.body.uuid
     * @param {String} options.body.body
     * @param {String} options.body.channel_uuid
     * @param {Object} options.file
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, file: null, user: null }) {
        Validator.create(options);

        const { body, file, user } = options;
        const { uuid, body: msg, channel_uuid } = body;
        const { sub: user_uuid } = user;

        const channel = await Channel.findOne({ _id: channel_uuid }).populate('room');
        if (!channel) throw new err.EntityNotFoundError('channel');

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const room_uuid = channel.room._id;
        const upload_src = await this.createUpload({ uuid, room_uuid, file });

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const roomFileUuid = (upload_src ? uuidv4() : null);
            if (upload_src) {                
                await RoomFile.insertMany([{
                    _id: roomFileUuid,
                    src: upload_src,
                    size: file.size,
                    room_file_type: "ChannelMessageUpload",
                    room: room_uuid,
                }], { session });
            }

            await ChannelMessage.insertMany([{
                _id: uuid,
                body: msg,
                channel_message_type: "User",
                channel: channel_uuid,
                user: user_uuid,
                ...(upload_src && { 
                    channel_message_upload: {
                        _id: uuidv4(),
                        channel_message_upload_type: getUploadType(file),
                        room_file: roomFileUuid,
                    } 
                }),
            }], { session });
            
            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            // Delete the avatar file if it was uploaded
            if (upload_src) storage.deleteFile(storage.parseKey(upload_src));
            console.error(JSON.stringify(error));
            throw error;
        } finally {
            session.endSession();
        }

        const channelMessage = await ChannelMessage.findOne({ _id: uuid })
            .populate('channel user')
            .populate('channel_message_upload.room_file')
            .populate('channel.channel_webhook')
            .populate('channel.channel_webhook.room_file')
            .then((channelMessage) => dto({
                ...channelMessage._doc,
                room: channelMessage.channel.room._doc,
                ...(channelMessage.user && { user: channelMessage.user._doc }),
                ...(channelMessage.channel_message_upload && {
                    channel_message_upload: {
                        ...channelMessage.channel_message_upload._doc,
                        ...(channelMessage.channel_message_upload.room_file && {
                            room_file: channelMessage.channel_message_upload.room_file
                        }),
                    }
                }),
            }));

        BroadcastChannelService.create(channelMessage)

        return channelMessage;
    }

    /**
     * @function update
     * @description Update a channel message
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.body
     * @param {String} options.body.body
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async update(options = { uuid: null, body: null, user: null }) {
        Validator.update(options);

        const { uuid, body, user } = options;
        const { body: msg } = body;
        const { sub: user_uuid } = user;

        const channelMessage = await ChannelMessage.findOne({ _id: uuid })
            .populate('channel user')
            .populate('channel_message_upload.room_file')
            .populate('channel.channel_webhook')
            .populate('channel.channel_webhook.room_file')
            .populate('channel.room');
        if (!channelMessage) throw new err.EntityNotFoundError('channel_message');

        const channel_uuid = channelMessage.channel._id;
        const isOwner = channelMessage.user?._id === user_uuid;
        const [moderator, admin] = await Promise.all([
            RPS.isInRoomByChannel({ channel_uuid, user, role_name: 'Moderator' }),
            RPS.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }),
        ]);
        if (!isOwner && !moderator && !admin) {
            throw new err.OwnershipOrLeastModRequiredError("channel_message");
        }

        await ChannelMessage.findOneAndUpdate(
            { _id: uuid }, 
            { body: msg }
        );

        const updateChannelMessage = dto({
            ...channelMessage._doc,
            body: msg,
            room: channelMessage.channel.room._doc,
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

        BroadcastChannelService.update(updateChannelMessage);

        return updateChannelMessage;
    }

    /**
     * @function destroy
     * @description Delete a channel message
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null, user: null }) {
        Validator.destroy(options);

        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        const channelMessage = await ChannelMessage.findOne({ _id: uuid })
            .populate('channel')
            .populate('channel.room')
            .populate('channel_message_upload.room_file')
            .populate('user');
        if (!channelMessage) throw new err.EntityNotFoundError('channel_message');

        const channel_uuid = channelMessage.channel._id;
        const isOwner = channelMessage.user?._id === user_uuid;

        const [moderator, admin] = await Promise.all([
            RPS.isInRoomByChannel({ channel_uuid, user, role_name: 'Moderator' }),
            RPS.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }),
        ]);

        if (!isOwner && !moderator && !admin) {
            throw new err.OwnershipOrLeastModRequiredError("channel_message");
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            await ChannelMessage.deleteOne({ _id: uuid });

            if (channelMessage.channel_message_upload?.room_file) {
                const roomFile = channelMessage.channel_message_upload.room_file;
                await RoomFile.deleteOne({ _id: roomFile._id });
                await storage.deleteFile(storage.parseKey(roomFile.src));
            }
            
            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            // Delete the avatar file if it was uploaded
            if (upload_src) storage.deleteFile(storage.parseKey(upload_src));
            console.error(JSON.stringify(error));
            throw error;
        } finally {
            session.endSession();
        }

        BroadcastChannelService.destroy(channelMessage.channel._id, uuid);
    }

    /**
     * @function createUpload
     * @description Create a channel message upload file (helper function)
     * @param {Object} options
     * @param {String} options.uuid
     * @param {String} options.room_uuid
     * @param {Object} options.file
     * @returns {Promise<String | null>}
     */
    async createUpload(options = { uuid: null, room_uuid: null, file: null }) {
        if (!options) throw new Error('createUpload: options is required');
        if (!options.uuid) throw new Error('createUpload: options.uuid is required');
        if (!options.room_uuid) throw new Error('createUpload: options.room_uuid is required');

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

const service = new ChannelMessageService();

export default service;
