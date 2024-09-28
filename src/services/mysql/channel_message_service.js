import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';
import ControllerError from '../../errors/controller_error.js';
import StorageService from '../storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import { broadcastChannel } from '../../../websocket_server.js';

const storage = new StorageService('channel_message_upload');
const getUploadType = (file) => {
    const mime = file.mimetype;
    if (mime.startsWith('image')) {
        return 'Image';
    } else if (mime.startsWith('video')) {
        return 'Video';
    } else {
        return 'Document';
    }
};

const dto = (m) => {
    const res = {
        uuid: m.channel_message_uuid,
        body: m.channel_message_body,
        channel_message_type_name: m.channel_message_type_name,
        channel_uuid: m.channel_uuid,
        room_uuid: m.room_uuid,
        created_at: m.channel_message_created_at,
        updated_at: m.channel_message_updated_at,

    };

    if (m.channel_message_upload_uuid) {
        res.channel_message_upload = {};
        res.channel_message_upload.uuid = m.channel_message_upload_uuid;
        res.channel_message_upload.channel_message_upload_type_name = m.channel_message_upload_type_name;

        if (m.room_file_uuid) {
            res.channel_message_upload.room_file = {};
            res.channel_message_upload.room_file.uuid = m.room_file_uuid;
            res.channel_message_upload.room_file.src = m.room_file_src;
            res.channel_message_upload.room_file.room_file_type_name = m.room_file_type_name;
            res.channel_message_upload.room_file.size_bytes = m.room_file_size;
            res.channel_message_upload.room_file.size_mb = parseFloat(m.room_file_size_mb);
        }
    }

    if (m.user_uuid) {
        res.user = {};
        res.user.uuid = m.user_uuid;
        res.user.username = m.user_username;
        res.user.avatar_src = m.user_avatar_src;
    }

    if (m.channel_webhook_message_uuid) {
        res.channel_webhook_message = {};
        res.channel_webhook_message.uuid = m.channel_webhook_message_uuid;
        res.channel_webhook_message.channel_webhook = {};
        res.channel_webhook_message.channel_webhook.uuid = m.channel_webhook_uuid;
        res.channel_webhook_message.channel_webhook.name = m.channel_webhook_name;
        res.channel_webhook_message.channel_webhook.room_file = {};
        res.channel_webhook_message.channel_webhook.room_file.uuid = m.channel_webhook_room_file_uuid;
        res.channel_webhook_message.channel_webhook.room_file.src = m.channel_webhook_room_file_src;
    }

    return res;
};

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.ChannelMessageView, dto);
    }

    async findOne(options = { channel_message_uuid: null, user: null }) {
        const { channel_message_uuid, user } = options;

        if (!channel_message_uuid) {
            throw new ControllerError(400, 'No channel_message_uuid provided');
        }
        const existing = await super.findOne({ ...options });
        if (!existing) {
            throw new ControllerError(404, 'Channel Message not found');
        }
        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: existing.channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return existing;
    }

    async findAll(options = { channel_uuid: null, user: null }) {
        const { channel_uuid, user } = options;
        if (!channel_uuid) {
            throw new ControllerError(400, 'No channel_uuid provided');
        }
        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }
        return await super.findAll({ ...options, where: { channel_uuid } });
    }

    async create(options = { body: null, file: null, user: null }) {
        const { body, file, user } = options;
        const { uuid, body: msg, channel_uuid } = body;
        const { sub: user_uuid } = user;

        if (!body) {
            throw new ControllerError(400, 'No body provided');
        }
        if (!uuid) {
            throw new ControllerError(400, 'No UUID provided');
        }
        if (!msg) {
            throw new ControllerError(400, 'No body.body provided');
        }
        if (!channel_uuid) {
            throw new ControllerError(400, 'No channel_uuid provided');
        }

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

        const ch = await service.findOne({ channel_message_uuid: uuid, user });

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was created.
          */
        broadcastChannel(`channel-${channel_uuid}`, 'chat_message_created', ch);

        return ch;
    }

    async update(options = { channel_message_uuid: null, body: null, user: null }) {
        const { channel_message_uuid, body, user } = options;
        const { body: msg } = body;
        const { sub: user_uuid } = user;

        if (!body) {
            throw new ControllerError(400, 'No body provided');
        }
        if (!channel_message_uuid) {
            throw new ControllerError(400, 'No channel_message_uuid provided');
        }

        const existing = await service.findOne({ channel_message_uuid, user });
        if (!existing) {
            throw new ControllerError(404, 'Channel Message not found');
        }
        console.log(existing, user_uuid);
        if (existing.user?.uuid !== user_uuid &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid: existing.channel_uuid, user, role_name: 'Moderator' })) &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid: existing.channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an owner of the message, or an admin or moderator of the room');
        }

        if (!msg) {
            body.body = existing.body;
        }

        await db.sequelize.query('CALL edit_channel_message_proc(:channel_message_uuid, :msg, @result)', {
            replacements: {
                channel_message_uuid,
                msg: body.body,
            },
        });

        const ch = await service.findOne({ channel_message_uuid, user });
        const channel_uuid = ch.channel_uuid;

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was updated.
          */
        broadcastChannel(`channel-${channel_uuid}`, 'chat_message_updated', { channel_uuid });

        return ch;
    }

    async destroy(options = { channel_message_uuid: null, user: null }) {
        const { channel_message_uuid, user } = options;
        const { sub: user_uuid } = user;

        if (!channel_message_uuid) {
            throw new ControllerError(400, 'No channel_message_uuid provided');
        }

        const existing = await service.model.findOne({ where: { channel_message_uuid } });
        if (!existing) {
            throw new ControllerError(404, 'Channel Message not found');
        }

        const channel_uuid = existing.channel_uuid;

        if (existing.user_uuid !== user_uuid &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Moderator' })) &&
            !(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an owner of the message, or an admin or moderator of the room');
        }

        await db.sequelize.query('CALL delete_channel_message_proc(:channel_message_uuid, @result)', {
            replacements: {
                channel_message_uuid,
            },
        });

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was deleted.
          */
        broadcastChannel(`channel-${channel_uuid}`, 'chat_message_deleted', { channel_uuid });
    }
}

const service = new Service();

export default service;
