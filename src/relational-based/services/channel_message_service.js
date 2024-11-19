import ChannelMessageServiceValidator from '../../shared/validators/channel_message_service_validator.js';
import MysqlBaseFindService from './_mysql_base_find_service.js';
import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/channel_message_dto.js';
import db from '../sequelize/models/index.cjs';
import { getUploadType } from '../../shared/utils/file_utils.js';
import { broadcastChannel } from '../../../websocket_server.js';

const storage = new StorageService('channel_message_upload');

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.ChannelMessageView, dto);
    }

    async findOne(options = { uuid: null, user: null }) {
        ChannelMessageServiceValidator.findOne(options);
        const { user, uuid } = options;
        const existing = await super.findOne({ uuid });

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: existing.channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return existing;
    }

    async findAll(options = { channel_uuid: null, user: null, page: null, limit: null }) {
        options = ChannelMessageServiceValidator.findAll(options);
        const { channel_uuid, user, page, limit } = options;

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return await super.findAll({ page, limit, where: { channel_uuid } });
    }

    async create(options = { body: null, file: null, user: null }) {
        ChannelMessageServiceValidator.create(options);

        const { body, file, user } = options;
        const { uuid, body: msg, channel_uuid } = body;
        const { sub: user_uuid } = user;

        const channel = await db.ChannelView.findOne({ where: { channel_uuid } });
        if (!channel) {
            throw new ControllerError(404, 'Channel not found');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        if (file && file.size > 0) {
            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid: channel.room_uuid, bytes: file.size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid: channel.room_uuid, bytes: file.size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }
            body.src = await storage.uploadFile(file, uuid);
            body.bytes = file.size;
            body.upload_type = getUploadType(file);
        }
        
        await db.sequelize.query('CALL create_channel_message_proc(:uuid, :msg, :channel_message_type_name, :channel_uuid, :user_uuid, :upload_type, :upload_src, :bytes, :room_uuid, @result)', {
            replacements: {
                uuid,
                msg,
                channel_message_type_name: "User",
                channel_uuid,
                user_uuid,
                upload_type: body.upload_type || null,
                upload_src: body.src || null,
                bytes: body.bytes || null,
                room_uuid: channel.room_uuid,
            },
        });

        const ch = await service.findOne({ uuid, user });

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was created.
          */
        broadcastChannel(`channel-${channel_uuid}`, 'chat_message_created', ch);

        return ch;
    }

    async update(options = { uuid: null, body: null, user: null }) {
        ChannelMessageServiceValidator.update(options);

        const { uuid, body, user } = options;
        const { body: msg } = body;
        const { sub: user_uuid } = user;

        const existing = await service.findOne({ uuid, user });

        if (existing.user?.uuid !== user_uuid &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid: existing.channel_uuid, user, role_name: 'Moderator' })) &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid: existing.channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an owner of the message, or an admin or moderator of the room');
        }

        if (!msg) {
            body.body = existing.body;
        }

        await db.sequelize.query('CALL edit_channel_message_proc(:uuid, :msg, @result)', {
            replacements: {
                uuid,
                msg: body.body,
            },
        });

        const ch = await service.findOne({ uuid, user });
        const channel_uuid = ch.channel_uuid;

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was updated.
          */
        broadcastChannel(`channel-${channel_uuid}`, 'chat_message_updated', ch);

        return ch;
    }

    async destroy(options = { uuid: null, user: null }) {
        ChannelMessageServiceValidator.destroy(options);

        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        const existing = await service.findOne({ uuid, user });
        const channel_uuid = existing.channel_uuid;

        if (existing.user_uuid !== user_uuid &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Moderator' })) &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an owner of the message, or an admin or moderator of the room');
        }

        await db.sequelize.query('CALL delete_channel_message_proc(:uuid, @result)', {
            replacements: {
                uuid,
            },
        });

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was deleted.
          */
        broadcastChannel(`channel-${channel_uuid}`, 'chat_message_deleted', { uuid });
    }
}

const service = new Service();

export default service;
