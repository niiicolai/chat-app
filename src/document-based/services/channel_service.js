import Validator from '../../shared/validators/channel_service_validator.js';
import err from '../../shared/errors/index.js';
import StorageService from '../../shared/services/storage_service.js';
import RPS from './room_permission_service.js';
import dto from '../dto/channel_dto.js';
import Channel from '../mongoose/models/channel.js';
import ChannelType from '../mongoose/models/channel_type.js';
import Room from '../mongoose/models/room.js';
import RoomFile from '../mongoose/models/room_file.js';
import ChannelMessage from '../mongoose/models/channel_message.js';
import mongoose from '../mongoose/index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @constant storage
 * @description Storage service instance
 * @type {StorageService}
 */
const storage = new StorageService('channel_avatar');

/**
 * @class ChannelService
 * @description Service class for channels.
 * @exports ChannelService
 */
class ChannelService {

    /**
     * @function findOne
     * @description Find a channel by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const { uuid, user } = options;
        const channel = await Channel.findOne({ _id: uuid }).populate('room room_file');
        if (!channel) throw new err.EntityNotFoundError('channel');

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid: uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto(channel._doc);
    }

    /**
     * @function findAll
     * @description Find all channels by room_uuid
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {Number} options.page
     * @param {Number} options.limit
     * @returns {Promise<Object>}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = Validator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        const isInRoom = await RPS.isInRoom({ room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const room = await Room.findOne({ _id: room_uuid });
        if (!room) throw new err.EntityNotFoundError('room');

        const params = { room: room._id };
        const [total, data] = await Promise.all([
            Channel.find(params).countDocuments(),
            Channel.find(params)
                .populate('room room_file')
                .sort({ created_at: -1 })
                .limit(limit || 0)
                .skip((page && limit) ? offset : 0)
                .then((channels) => channels.map((channel) => dto(channel._doc))),
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
     * @description Create a channel
     * @param {Object} options
     * @param {Object} options.body
     * @param {String} options.body.uuid
     * @param {String} options.body.name
     * @param {String} options.body.description
     * @param {String} options.body.channel_type_name
     * @param {String} options.body.room_uuid
     * @param {Object} options.file
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, file: null, user: null }) {
        Validator.create(options);

        const { body, file, user } = options;
        const { uuid, name, description, channel_type_name, room_uuid } = body;

        const room = await Room.findOne({ _id: room_uuid });
        if (!room) throw new err.EntityNotFoundError('room');

        const isAdmin = await RPS.isInRoom({ room_uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const validType = await ChannelType.findOne({ _id: channel_type_name });
        if (!validType) throw new err.EntityNotFoundError('channel_type_name');

        const uuidExists = await Channel.findOne({ _id: uuid });
        if (uuidExists) throw new err.DuplicateEntryError('channel', 'PRIMARY', uuid);

        const nameAndTypeExists = await Channel.findOne(
            { name, channel_type: channel_type_name, room: room._id }
        );
        if (nameAndTypeExists) {
            throw new err.DuplicateEntryError('channel', 'name_type_room_uuid', `${name}-${channel_type_name}-${room_uuid}`);
        }

        const exceedsLimit = await RPS.channelCountExceedsLimit({ room_uuid, add_count: 1 });
        if (exceedsLimit) throw new err.ExceedsRoomChannelCountError();

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
                    room_file_type: "ChannelAvatar",
                    room: room_uuid,
                }], { session });
            }
            
            await Channel.insertMany([{
                _id: uuid,
                name,
                description,
                channel_type: channel_type_name,
                room: room_uuid,
                ...(avatar_src && { room_file: roomFileUuid }),
            }], { session });

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
        
        const newChannel = await Channel.findOne({ _id: uuid }).populate('room room_file');
        
        return dto(newChannel._doc);
    }

    /**
     * @function update
     * @description Update a channel by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.body
     * @param {Object} options.body.name
     * @param {Object} options.body.description
     * @param {Object} options.file
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async update(options = { uuid: null, body: null, file: null, user: null }) {
        Validator.update(options);

        const { uuid, body, file, user } = options;
        const { name, description } = body;

        const channel = await Channel.findOne({ _id: uuid }).populate('room');
        if (!channel) throw new err.EntityNotFoundError('channel');

        const room_uuid = channel.room._id;
        const isAdmin = await RPS.isInRoom({ room_uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const avatar_src = await this.createAvatar({ uuid, room_uuid, file });

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const newRoomFileUuid = (avatar_src ? uuidv4() : null);
            const oldRoomFile = channel.room_file;
            if (avatar_src) {                
                await RoomFile.insertMany([{
                    _id: newRoomFileUuid,
                    src: avatar_src,
                    size: file.size,
                    room_file_type: "ChannelAvatar",
                    room: room_uuid,
                }], { session });
            }
            
            await Channel.updateOne(
                { _id: uuid }, 
                { 
                    ...(name && { name }),
                    ...(description && { description }),
                    ...(avatar_src && { room_file: newRoomFileUuid }),
                },
                { session },
            );

            if (oldRoomFile && avatar_src) {
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

        const newChannel = await Channel.findOne({ _id: uuid }).populate('room room_file');
        
        return dto(newChannel._doc);
    }

    /**
     * @function destroy
     * @description Destroy a channel by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null, user: null }) {
        Validator.destroy(options);

        const { uuid, user } = options;

        const channel = await Channel.findOne({ _id: uuid })
            .populate('room room_file channel_webhook.room_file');
        if (!channel) throw new err.EntityNotFoundError('channel');

        const isAdmin = await RPS.isInRoomByChannel({ channel_uuid: uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // If the channel is the join channel of a room, set it to null
            await Room.findOneAndUpdate(
                { 'room_join_settings.join_channel': channel._id },
                { 'room_join_settings.join_channel': null },
                { session },
            );
            
            await ChannelMessage.deleteMany({ channel: channel._id }, { session });
            await Channel.deleteOne({ _id: uuid }, { session });

            const roomFilesForDeletion = [
                ...[channel.room_file && [channel.room_file]],
                ...[channel.channel_webhook?.room_file && [channel.channel_webhook.room_file]],
            ];

            // Delete room files from the database first
            await RoomFile.deleteMany({ _id: { $in: roomFilesForDeletion
                .filter(Boolean)
                .map((file) => file._id) 
            }}, { session });
            // Delete room files from the storage
            await Promise.all(roomFilesForDeletion
                .filter(Boolean)
                .map((file) => storage.deleteFile(storage.parseKey(file.src))
            ));

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
    }

    /**
     * @function createAvatar
     * @description Create a channel avatar (helper function)
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
                RoomPermissionService.fileExceedsSingleFileSize({ room_uuid, bytes: file.size }),
                RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid, bytes: file.size }),
            ]);

            if (totalLimit) throw new err.ExceedsRoomTotalFilesLimitError();
            if (singleLimit) throw new err.ExceedsSingleFileSizeError();

            return await storage.uploadFile(file, uuid);
        }

        return null;
    }
}

const service = new ChannelService();

export default service;
