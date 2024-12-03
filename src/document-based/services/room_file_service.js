import Validator from '../../shared/validators/room_file_service_validator.js';
import err from '../../shared/errors/index.js';
import StorageService from '../../shared/services/storage_service.js';
import RPS from './room_permission_service.js';
import dto from '../dto/room_file_dto.js';
import RoomFile from '../mongoose/models/room_file.js';
import Room from '../mongoose/models/room.js';
import ChannelMessage from '../mongoose/models/channel_message.js';
import Channel from '../mongoose/models/channel.js';
import mongoose from '../mongoose/index.js';

/**
 * @constant storage
 * @description Storage service instance
 * @type {StorageService}
 */
const storage = new StorageService('room_file');

/**
 * @class RoomFileService
 * @description Service class for room files.
 * @exports RoomFileService
 */
class RoomFileService {

    /**
     * @function findOne
     * @description Find a room file by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const { uuid, user } = options;
        const roomFile = await RoomFile.findOne({ _id: uuid }).populate('room');
        if (!roomFile) throw new err.EntityNotFoundError('room_file');

        const isInRoom = await RPS.isInRoom({ room_uuid: roomFile.room._id, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto(roomFile._doc);
    }

    /**
     * @function findAll
     * @description Find all room files by room_uuid
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {Number} options.page optional
     * @param {Number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = Validator.findAll(options);

        const { room_uuid, page, limit, offset, user } = options;

        const room = await Room.findOne({ _id: room_uuid });
        if (!room) throw new err.EntityNotFoundError('room');

        const isInRoom = await RPS.isInRoom({ room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();
        
        const params = { room: room._id };
        const [total, data] = await Promise.all([
            RoomFile.find(params).countDocuments(),
            RoomFile.find(params)
                .populate('room')
                .sort({ created_at: -1 })
                .limit(limit || 0)
                .skip((page && limit) ? offset : 0)
                .then((files) => files.map((file) => dto(file._doc))),
        ]);

        return {
            total,
            data,
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }

    /**
     * @function destroy
     * @description Delete a room file by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null, user: null }) {
        Validator.destroy(options);

        const { uuid, user } = options;
        const roomFile = await RoomFile.findOne({ _id: uuid }).populate('room');
        if (!roomFile) throw new err.EntityNotFoundError('room_file');

        const room_uuid = roomFile.room._id;
        const isMessageUpload = roomFile.room_file_type === 'ChannelMessageUpload';

        const [isOwner, isAdmin, isModerator] = await Promise.all([
            this.isOwner({ uuid, user }),
            RPS.isInRoom({ room_uuid, user, role_name: 'Admin' }),
            RPS.isInRoom({ room_uuid, user, role_name: 'Moderator' })
        ]);

        if (!isOwner && !isAdmin && !isModerator) {
            throw new err.OwnershipOrLeastModRequiredError("room_file");
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            if (isMessageUpload) {
                await ChannelMessage.updateOne(
                    { 'channel_message_upload.room_file': uuid },
                    { $unset: { channel_message_upload: "" } },
                    { session }
                );
            }
            else if (roomFile.room_file_type.name === 'ChannelWebhookAvatar') {
                await Channel.updateOne(
                    { 'channel_webhook.room_file': uuid },
                    { $unset: { 'channel_webhook.room_file': "" } },
                    { session }
                );
            }
            else if (roomFile.room_file_type.name === 'ChannelAvatar') {
                await Channel.updateOne(
                    { room_file: uuid },
                    { $unset: { room_file: "" } },
                    { session }
                );
            }
            else if (roomFile.room_file_type.name === 'RoomAvatar') {
                await Channel.updateOne(
                    { _id: room_uuid },
                    { $unset: { 'room_avatar.room_file': "" } },
                    { session }
                );
            }

            await RoomFile.deleteOne({ _id: roomFile._id }, { session });
            await session.commitTransaction();

            const key = storage.parseKey(roomFile.src);
            await storage.deleteFile(key);
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * @function isOwner
     * @description Check if the user is the owner/creator of the file
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Boolean>}
     */
    async isOwner(options = { uuid: null, user: null }) {
        Validator.isOwner(options);

        const { uuid, user } = options;
        const { sub: user_uuid } = user;
        const channelMessage = await ChannelMessage
            .findOne({ 'channel_message_upload.room_file': uuid })
            .populate('user');

        if (!channelMessage) return false;
        return channelMessage.user._id === user_uuid;
    }
};

const service = new RoomFileService();

export default service;
