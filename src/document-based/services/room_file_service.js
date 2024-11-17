import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/room_file_dto.js';
import RoomFile from '../mongoose/models/room_file.js';
import Room from '../mongoose/models/room.js';
import ChannelMessageUpload from '../mongoose/models/channel_message_upload.js';
import ChannelMessage from '../mongoose/models/channel_message.js';
import ChannelWebhook from '../mongoose/models/channel_webhook.js';
import Channel from '../mongoose/models/channel.js';
import RoomFileServiceValidator from '../../shared/validators/room_file_service_validator.js';

const storage = new StorageService('room_file');

class Service {

    /**
     * @function findOne
     * @description Find a room file by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Object}
     */
    async findOne(options = { uuid: null, user: null }) {
        RoomFileServiceValidator.findOne(options);

        const roomFile = await RoomFile.findOne({ uuid: options.uuid }).populate('room');
        if (!roomFile) throw new ControllerError(404, 'Room file not found');

        if (!(await RoomPermissionService.isInRoom({ room_uuid: roomFile.room.uuid, user: options.user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return dto(roomFile);
    }

    /**
     * @function findAll
     * @description Find all room files by room_uuid
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {Number} options.page
     * @param {Number} options.limit
     * @returns {Object}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = RoomFileServiceValidator.findAll(options);
        const { room_uuid, page, limit, offset } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user: options.user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }
        
        const room = await Room.findOne({ uuid: room_uuid });
        if (!room) throw new ControllerError(404, 'Room not found');
        
        const params = { room: room._id };
        const total = await RoomFile.find(params).countDocuments();
        const roomFiles = await RoomFile.find(params)
            .populate('room')
            .sort({ created_at: -1 })
            .limit(limit || 0)
            .skip((page && limit) ? offset : 0);

        return {
            total,
            data: await Promise.all(roomFiles.map(async (roomFile) => {
                return dto({ ...roomFile._doc, room: { uuid: room_uuid } });
            })),
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
     * @returns {void}
     */
    async destroy(options = { uuid: null, user: null }) {
        RoomFileServiceValidator.destroy(options);

        const { uuid, user } = options;
        const roomFile = await RoomFile.findOne({ uuid }).populate('room');
        if (!roomFile) throw new ControllerError(404, 'Room file not found');

        const room_uuid = roomFile.room.uuid;
        const isMessageUpload = roomFile.room_file_type.name === 'ChannelMessageUpload';

        if (isMessageUpload &&
            !this.isOwner({ uuid, user }) &&
            !(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: 'Moderator' })) &&
            !(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an owner of the file, or an admin or moderator of the room');
        }

        if (isMessageUpload) {
            await ChannelMessage
                .findOne({ 'channel_message_upload.room_file': roomFile._id })
                .updateOne({ 'channel_message_upload': null });
        }
        else if (roomFile.room_file_type.name === 'ChannelWebhookAvatar') {
            await Channel
                .findOne({ 'channel_webhook.room_file': roomFile._id })
                .updateOne({ 'channel_webhook.room_file': null });
        }
        else if (roomFile.room_file_type.name === 'ChannelAvatar') {
            await Channel
                .findOne({ room_file: roomFile._id })
                .updateOne({ room_file: null });
        }
        else if (roomFile.room_file_type.name === 'RoomAvatar') {
            await Room
                .findOne({ uuid: roomFile.room.uuid })
                .updateOne({ 'room_avatar.room_file': null });
        }
       
        await RoomFile.deleteOne({ uuid });

        /**
         * Delete the file from storage as well
         */
        const key = storage.parseKey(roomFile.src);
        storage.deleteFile(key);
    }

    /**
     * @function isOwner
     * @description Check if the user is the owner/creator of the file
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Boolean}
     */
    async isOwner(options = { uuid: null, user: null }) {
        RoomFileServiceValidator.isOwner(options);

        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        const channelMessageUpload = await ChannelMessageUpload.findOne({ 'room_file.uuid': uuid }).populate('channel_message');
        if (!channelMessageUpload) throw new ControllerError(404, 'isOwner: Channel message upload not found');

        const channelMessage = await ChannelMessage.findOne({ uuid: channelMessageUpload.channel_message.uuid }).populate('user');
        if (!channelMessage) throw new ControllerError(404, 'isOwner: Channel message not found');

        return channelMessage.user.uuid === user_uuid;
    }
};

const service = new Service();

export default service;
