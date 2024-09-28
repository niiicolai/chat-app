import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';
import ControllerError from '../../errors/controller_error.js';
import StorageService from '../storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import { broadcastChannel } from '../../../websocket_server.js';
import { v4 as uuidv4 } from 'uuid';

const storage = new StorageService('channel_avatar');

const dto = (m) => {
    const res = {
        uuid: m.channel_webhook_uuid,
        name: m.channel_webhook_name,
        description: m.channel_webhook_description,
        channel_uuid: m.channel_uuid,
        room_uuid: m.room_uuid,
        created_at: m.channel_webhook_created_at,
        updated_at: m.channel_webhook_updated_at,
    };
    if (m.room_file_uuid) {
        res.room_file = {};
        res.room_file.uuid = m.room_file_uuid;
        res.room_file.src = m.room_file_src;
        res.room_file.room_file_type_name = m.room_file_type_name;
        res.room_file.size_bytes = m.room_file_size;
        res.room_file.size_mb = parseFloat(m.room_file_size_mb);
    }
    return res;
};

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.ChannelWebhookView, dto);
    }

    async findOne(options = { user: null }) {
        const { user } = options;
        const webhook = await super.findOne({ ...options });
        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: webhook.channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }
        return webhook;
    }

    async findAll(options = { room_uuid: null, user: null }) {
        const { room_uuid, user } = options;
        if (!room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }
        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }
        return await super.findAll({ ...options, where: { room_uuid } });
    }

    async create(options={ body: null, file: null, user: null }) {
        const { body, file, user } = options;
        const { uuid, name, description, channel_uuid } = body;
        if (!body) {
            throw new ControllerError(400, 'No body provided');
        }
        if (!uuid) {
            throw new ControllerError(400, 'No UUID provided');
        }
        if (!name) {
            throw new ControllerError(400, 'No name provided');
        }
        if (!description) {
            throw new ControllerError(400, 'No description provided');
        }
        if (!channel_uuid) {
            throw new ControllerError(400, 'No channel_uuid provided');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin in the room');
        }

        const channel = await db.ChannelView.findOne({ where: { channel_uuid } });
        if (!channel) {
            throw new ControllerError(400, 'Channel does not exist');
        }

        if (await db.ChannelWebhookView.findOne({ where: { channel_webhook_uuid: uuid } })) {
            throw new ControllerError(400, 'Channel webhook with that UUID already exists');
        }

        const channelCheck = await db.ChannelWebhookView.findOne({ where: { channel_uuid } });
        if (channelCheck) {
            throw new ControllerError(400, 'Channel already has a webhook');
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
        }

        await db.sequelize.query('CALL create_channel_webhook_proc(:uuid, :channel_uuid, :name, :description, :src, :bytes, :room_uuid, @result)', {
            replacements: {
                uuid,
                channel_uuid,
                name,
                description,
                src: body.src || null,
                bytes: body.bytes || null,
                room_uuid: channel.room_uuid,
            },
        });
        const result = await db.sequelize.query('SELECT @result as result');
        console.log(result);

        return await service.findOne({ channel_webhook_uuid: uuid, user });
    }

    async update(options={ channel_webhook_uuid: null, body: null, file: null, user: null }) {
        const { channel_webhook_uuid, body, file, user } = options;
        const { name, description } = body;

        if (!channel_webhook_uuid) {
            throw new ControllerError(400, 'No channel_webhook_uuid provided');
        }

        const existing = await service.model.findOne({ where: { channel_webhook_uuid } });
        if (!existing) {
            throw new ControllerError(404, 'Channel Webhook not found');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: existing.channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin in the room');
        }

        if (!name) {
            body.name = existing.channel_webhook_name;
        }

        if (!description) {
            body.description = existing.channel_webhook_description;
        }

        if (file && file.size > 0) {
            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid: existing.room_uuid, bytes: file.size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid: existing.room_uuid, bytes: file.size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }
            body.src = await storage.uploadFile(file, channel_webhook_uuid);
            body.bytes = file.size;
        } else {
            body.src = existing.room_file_src;
            body.bytes = existing.room_file_size;
        }

        await db.sequelize.query('CALL edit_channel_webhook_proc(:channel_webhook_uuid, :name, :description, :src, :bytes, :room_uuid, @result)', {
            replacements: {
                channel_webhook_uuid,
                name: body.name,
                description: body.description,
                src: body.src || null,
                bytes: body.bytes || null,
                room_uuid: existing.room_uuid,
            },
        });

        return await service.findOne({ channel_webhook_uuid, user });
    }

    async destroy(options={ channel_webhook_uuid: null, user: null }) {
        const { channel_webhook_uuid, user } = options;

        if (!channel_webhook_uuid) {
            throw new ControllerError(400, 'No channel_webhook_uuid provided');
        }

        const existing = await service.model.findOne({ where: { channel_webhook_uuid } });
        if (!existing) {
            throw new ControllerError(404, 'Channel Webhook not found');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: existing.channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin in the room');
        }

        await db.sequelize.query('CALL delete_channel_webhook_proc(:channel_webhook_uuid, @result)', {
            replacements: {
                channel_webhook_uuid,
            },
        });
    }

    async message(options={ channel_webhook_uuid: null, body: null }) {
        const { channel_webhook_uuid, body, user } = options;
        const { message } = body;

        if (!channel_webhook_uuid) {
            throw new ControllerError(400, 'No channel_webhook_uuid provided');
        }
        if (!message) {
            throw new ControllerError(400, 'No message provided');
        }

        const channelWebhook = await service.model.findOne({ where: { channel_webhook_uuid } });
        if (!channelWebhook) {
            throw new ControllerError(404, 'Channel Webhook not found');
        }

        const channel_message_uuid = uuidv4();
        const channel_uuid = channelWebhook.channel_uuid;
        await db.sequelize.query('CALL create_webhook_message_proc(:message_uuid_input, :message_body_input, :channel_uuid_input, :channel_webhook_uuid_input, :channel_webhook_message_type_name_input, @result)', {
            replacements: {
                message_uuid_input: channel_message_uuid,
                message_body_input: message,
                channel_uuid_input: channel_uuid,
                channel_webhook_uuid_input: channel_webhook_uuid,
                channel_webhook_message_type_name_input: 'Custom',
            },
        });

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was deleted.
          */
        broadcastChannel(`channel-${channel_uuid}`, 'chat_message_created', { channel_uuid });
    }
}

const service = new Service();

export default service;
