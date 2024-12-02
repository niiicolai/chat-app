import ChannelMessageServiceValidator from '../../shared/validators/channel_message_service_validator.js';
import VerifiedEmailRequiredError from '../../shared/errors/verified_email_required_error.js';
import ExceedsRoomTotalFilesLimitError from '../../shared/errors/exceeds_room_total_files_limit_error.js';
import ExceedsSingleFileSizeError from '../../shared/errors/exceeds_single_file_size_error.js';
import AdminPermissionRequiredError from '../../shared/errors/admin_permission_required_error.js';
import RoomMemberRequiredError from '../../shared/errors/room_member_required_error.js';
import EntityNotFoundError from '../../shared/errors/entity_not_found_error.js';
import RoomLeastOneAdminRequiredError from '../../shared/errors/room_least_one_admin_required_error.js';
import DuplicateEntryError from '../../shared/errors/duplicate_entry_error.js';
import ControllerError from '../../shared/errors/controller_error.js';
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
        const channelMessage = await ChannelMessage.findOne({ _id: uuid })
            .populate('channel user')
            .populate('channel_message_upload.room_file')
            .populate('channel.channel_webhook')
            .populate('channel.channel_webhook.room_file')

        if (!channelMessage) throw new EntityNotFoundError('channel_message');

        await RPS.isInRoomByChannel({ channel_uuid: channelMessage.channel._id, user, role_name: null }).then((isInRoom) => {
            if (!isInRoom) throw new RoomMemberRequiredError();
        });

        return dto({
            ...channelMessage._doc,
            room: { uuid: channelMessage.channel.room._id },
            channel: { uuid: channelMessage.channel._id },
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
     * @returns {Object}
     */
    async findAll(options = { channel_uuid: null, user: null, page: null, limit: null }) {
        options = ChannelMessageServiceValidator.findAll(options);
        const { channel_uuid, user, page, limit, offset } = options;

        await RPS.isInRoomByChannel({ channel_uuid, user, role_name: null }).then((isInRoom) => {
            if (!isInRoom) throw new RoomMemberRequiredError();
        });

        const channel = await Channel.findOne({ _id: channel_uuid })
            .populate('room')
            .populate('channel_webhook')
            .populate('channel_webhook.room_file');
        if (!channel) throw new EntityNotFoundError('channel');

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
                    room: { uuid: channel.room.uuid },
                    channel: { uuid: channel.uuid },
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

    async create(options = { body: null, file: null, user: null }) {
        ChannelMessageServiceValidator.create(options);

        const { body, file, user } = options;
        const { uuid, body: msg, channel_uuid } = body;
        const { sub: user_uuid } = user;

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const {channel, room_uuid} = await Promise.all([
                Channel.findOne({ _id: channel_uuid }).session(session).populate('room'),
                User.findOne({ _id: user_uuid }).session(session),
                ChannelMessageType.findOne({ _id: 'User' }).session(session),
                RPS.isInRoomByChannel({ channel_uuid, user, role_name: null }, session),
            ]).then(([channel, savedUser, channel_message_type, isInRoom]) => {
                if (!channel) throw new EntityNotFoundError('channel');
                if (!savedUser) throw new EntityNotFoundError('user');
                if (!channel_message_type) throw new EntityNotFoundError('channel_message_type');
                if (!isInRoom) throw new RoomMemberRequiredError();

                return {channel, room_uuid: channel.room._id};
            });

            const channelMessage = new ChannelMessage({
                uuid,
                body: msg,
                channel_message_type: "User",
                channel: channel_uuid,
                user: user_uuid,
            });

            let room_file = null;
            if (file && file.size > 0) {
                await Promise.all([
                    RPS.fileExceedsTotalFilesLimit({ room_uuid, bytes: file.size }, session),
                    RPS.fileExceedsSingleFileSize({ room_uuid, bytes: file.size }, session),
                ]).then(([exceedsTotalFilesLimit, exceedsSingleFileSize]) => {
                    if (exceedsTotalFilesLimit) throw new ExceedsRoomTotalFilesLimitError();
                    if (exceedsSingleFileSize) throw new ExceedsSingleFileSizeError();
                });

                const src = await storage.uploadFile(file, uuid);
                room_file = await new RoomFile({
                    uuid: uuidv4(),
                    room_file_type: "ChannelMessageUpload",
                    src,
                    size: size,
                    room: room_uuid,
                }).save({ session });

                channelMessage.channel_message_upload = {
                    uuid: uuidv4(),
                    channel_message_upload_type: getUploadType(file),
                    room_file: room_file._id,
                };
            }

            await channelMessage.save({ session });

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
        if (!channelMessage) throw new ControllerError(404, 'channel_message not found');

        const channel_uuid = channelMessage.channel.uuid;
        const isOwner = channelMessage.user?.uuid === user_uuid;
        const [moderator, admin] = await Promise.all([
            RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Moderator' }),
            RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }),
        ]);
        if (!isOwner && !moderator && !admin) {
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
            .populate('channel_message_upload.room_file')
            .populate('user');
        if (!channelMessage) throw new ControllerError(404, 'channel_message not found');

        const channel_uuid = channelMessage.channel.uuid;
        const isOwner = channelMessage.user?.uuid === user_uuid;

        const [moderator, admin] = await Promise.all([
            RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Moderator' }),
            RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }),
        ]);

        if (!isOwner && !moderator && !admin) {
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
