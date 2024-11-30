import ChannelServiceValidator from '../../shared/validators/channel_service_validator.js';
import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/channel_dto.js';
import Channel from '../mongoose/models/channel.js';
import ChannelType from '../mongoose/models/channel_type.js';
import Room from '../mongoose/models/room.js';
import RoomFileType from '../mongoose/models/room_file_type.js';
import RoomFile from '../mongoose/models/room_file.js';
import ChannelMessage from '../mongoose/models/channel_message.js';
import ChannelAudit from '../mongoose/models/channel_audit.js';
import ChannelAuditType from '../mongoose/models/channel_audit_type.js';
import User from '../mongoose/models/user.js';
import { v4 as uuidv4 } from 'uuid';

const storage = new StorageService('channel_avatar');

class Service {

    /**
     * @function findOne
     * @description Find a channel by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Object}
     */
    async findOne(options = { uuid: null, user: null }) {
        ChannelServiceValidator.findOne(options);

        const { uuid, user } = options;
        const channel = await Channel.findOne({ uuid }).populate('room room_file');
        if (!channel) throw new ControllerError(404, 'channel not found');

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return dto(channel);
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
     * @returns {Object}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = ChannelServiceValidator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const room = await Room.findOne({ uuid: room_uuid });
        if (!room) throw new ControllerError(404, 'Room not found');

        const params = { room: room._id };
        const total = await Channel.find(params).countDocuments();
        const channels = await Channel.find(params)
            .populate('room room_file')
            .sort({ created_at: -1 })
            .limit(limit || 0)
            .skip((page && limit) ? offset : 0);

        return {
            total,
            data: channels.map(async (channel) => {
                return dto({ ...channel._doc, room: { uuid: room_uuid } });
            }),
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
     * @returns {Object}
     */
    async create(options = { body: null, file: null, user: null }) {
        ChannelServiceValidator.create(options);

        const { body, file, user } = options;
        const { uuid, name, description, channel_type_name, room_uuid } = body;

        const [isAdmin, exceedsLimit, uuidDuplicate, room, channel_type] = await Promise.all([
            RoomPermissionService.isInRoom({ room_uuid, user, role_name: 'Admin' }),
            RoomPermissionService.channelCountExceedsLimit({ room_uuid, add_count: 1 }),
            Channel.findOne({ uuid }),
            Room.findOne({ uuid: room_uuid }),
            ChannelType.findOne({ name: channel_type_name }),
        ]);

        if (!isAdmin) throw new ControllerError(403, 'User is not an admin of the room');
        if (exceedsLimit) throw new ControllerError(400, 'Room channel count exceeds limit. The room cannot have more channels');
        if (uuidDuplicate) throw new ControllerError(400, 'Channel with that UUID already exists');
        if (!room) throw new ControllerError(404, 'Room not found');
        if (!channel_type) throw new ControllerError(404, 'Channel type not found');
        if (await Channel.findOne({ channel_name: name, channel_type: channel_type._id, room: room._id })) {
            throw new ControllerError(400, 'Channel with that name and type already exists in the room');
        }
        
        const channel = new Channel({
            uuid,
            name,
            description,
            channel_type,
            room: room._id,
        });

        let room_file = null;
        if (file && file.size > 0) {
            const size = file.size;
            const room_file_type = await RoomFileType.findOne({ name: 'ChannelAvatar' });
            if (!room_file_type) throw new ControllerError(500, 'Room file type not found');

            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid, bytes: size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid, bytes: size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }

            const src = await storage.uploadFile(file, uuid);
            room_file = await new RoomFile({
                uuid,
                room_file_type,
                src: src,
                size: size,
                room: room._id,
            }).save();

            channel.room_file = room_file._id;
        }

        const [channel_audit_type, savedUser] = await Promise.all([
            ChannelAuditType.findOne({ name: 'MESSAGE_CREATED' }),
            User.findOne({ uuid: user.sub }),
        ]);

        if (!channel_audit_type) throw new ControllerError(500, 'Channel audit type not found');
        if (!savedUser) throw new ControllerError(404, 'User not found');

        await Promise.all([
            channel.save(),
            new ChannelAudit({
                uuid: uuidv4(),
                body: JSON.stringify(body),
                channel_audit_type,
                channel: channel._id,
                user: savedUser._id,
            }).save(),
        ]);
        
        return dto({ 
            ...channel._doc,
            ...(room_file && { room_file }),
            room: { uuid: room.uuid },
        });
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
     * @returns {Object}
     */
    async update(options = { uuid: null, body: null, file: null, user: null }) {
        ChannelServiceValidator.update(options);

        const { uuid, body, file, user } = options;
        const { name, description } = body;

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        const channel = await Channel.findOne({ uuid }).populate('room');
        if (!channel) throw new ControllerError(404, 'Channel not found');

        if (name) channel.name = name;
        if (description) channel.description = description;

        let room_file = null;
        if (file && file.size > 0) {
            const { uuid: room_uuid } = channel.room;
            const { size } = file;
            const room_file_type = await RoomFileType.findOne({ name: 'ChannelAvatar' });
            if (!room_file_type) throw new ControllerError(500, 'Room file type not found');

            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid, bytes: size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid, bytes: size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }

            const src = await storage.uploadFile(file, uuid);
            room_file = await new RoomFile({
                uuid,
                room_file_type,
                src: src,
                size: size,
                room: channel.room._id,
            }).save();

            channel.room_file = room_file._id;
        }

        await channel.save();

        return dto({ 
            ...channel._doc,
            ...(room_file && { room_file }),
            room: { uuid: channel.room.uuid },
        });
    }

    /**
     * @function destroy
     * @description Destroy a channel by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {void}
     */
    async destroy(options = { uuid: null, user: null }) {
        ChannelServiceValidator.destroy(options);

        const { uuid, user } = options;

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        const channel = await Channel.findOne({ uuid }).populate('room room_file channel_webhook.room_file');
        if (!channel) throw new ControllerError(404, 'Channel not found');

        if (channel.room_file) {
            await Promise.all([
                storage.deleteFile(storage.parseKey(channel.room_file.src)),
                RoomFile.deleteOne({ uuid: channel.room_file.uuid })
            ]);
        }

        if (channel?.channel_webhook?.room_file) {
            await Promise.all([
                storage.deleteFile(storage.parseKey(channel.channel_webhook.room_file.src)),
                RoomFile.deleteOne({ uuid: channel.channel_webhook.room_file.uuid })
            ]);
        }

        const channelMessages = await ChannelMessage.find({ channel: channel._id })
            .populate({
                path: 'channel_message_upload',
                model: 'ChannelMessageUpload',
                populate: {
                    path: 'room_file',
                    model: 'RoomFile',
                },
            });

        const roomFileIds = [];
        const channelMessageUploadIds = [];
        channelMessages.forEach((channelMessage) => {
            if (channelMessage.channel_message_upload) {
                channelMessageUploadIds.push(channelMessage.channel_message_upload._id);                
                roomFileIds.push(channelMessage.channel_message_upload.room_file._id);
                storage.deleteFile(storage.parseKey(channelMessage.channel_message_upload.room_file.src));
            }
        });
        
        await ChannelMessage.deleteMany({ channel: channel._id });
        await RoomFile.deleteMany({ _id: { $in: roomFileIds } });
        await Room.findOne({ 'room_join_settings.join_channel': channel._id })?.updateOne({ 'room_join_settings.join_channel': null });
        await Channel.deleteOne({ uuid });
    }
}

const service = new Service();

export default service;
