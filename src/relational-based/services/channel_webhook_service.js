import ChannelWebhookServiceValidator from '../../shared/validators/channel_webhook_service_validator.js';
import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../sequelize/models/index.cjs';
import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import channelMessageDto from '../dto/channel_message_dto.js';
import dto from '../dto/channel_webhook_dto.js';
import { broadcastChannel } from '../../../websocket_server.js';
import { v4 as uuidv4 } from 'uuid';

const storage = new StorageService('channel_avatar');

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.ChannelWebhookView, dto);
    }

    async findOne(options = { uuid: null, user: null }) {
        ChannelWebhookServiceValidator.findOne(options);

        const { user, uuid } = options;
        const webhook = await super.findOne({ uuid });

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: webhook.channel_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return webhook;
    }

    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = ChannelWebhookServiceValidator.findAll(options);
        const { room_uuid, user, page, limit } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return await super.findAll({ page, limit, where: { room_uuid } });
    }

    async create(options={ body: null, file: null, user: null }) {
        ChannelWebhookServiceValidator.create(options);

        const { body, file, user } = options;
        const { uuid, name, description, channel_uuid } = body;

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
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

        return await service.findOne({ uuid, user });
    }

    async update(options={ uuid: null, body: null, file: null, user: null }) {
        ChannelWebhookServiceValidator.update(options);

        const { uuid, body, file, user } = options;
        const { name, description } = body;

        const existing = await service.findOne({ uuid, user });

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: existing.channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        if (!name) {
            body.name = existing.name;
        }

        if (!description) {
            body.description = existing.description;
        }

        if (file && file.size > 0) {
            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid: existing.room_uuid, bytes: file.size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid: existing.room_uuid, bytes: file.size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }
            body.src = await storage.uploadFile(file, uuid);
            body.bytes = file.size;
        } else {
            body.src = existing.room_file?.src;
            body.bytes = existing.room_file?.size;
        }

        await db.sequelize.query('CALL edit_channel_webhook_proc(:uuid, :name, :description, :src, :bytes, :room_uuid, @result)', {
            replacements: {
                uuid,
                name: body.name,
                description: body.description,
                src: body.src || null,
                bytes: body.bytes || null,
                room_uuid: existing.room_uuid,
            },
        });

        return await service.findOne({ uuid, user });
    }

    async destroy(options={ uuid: null, user: null }) {
        ChannelWebhookServiceValidator.destroy(options);

        const { uuid, user } = options;
        const existing = await service.findOne({ uuid, user });

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: existing.channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        await db.sequelize.query('CALL delete_channel_webhook_proc(:uuid, @result)', {
            replacements: {
                uuid,
            },
        });
    }

    async message(options={ uuid: null, body: null }) {
        ChannelWebhookServiceValidator.message(options);

        const { uuid, body } = options;
        const { message } = body;

        const channelWebhook = await service.model.findOne({ where: { channel_webhook_uuid: uuid } });
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
                channel_webhook_uuid_input: uuid,
                channel_webhook_message_type_name_input: 'Custom',
            },
        });

        const channelMessage = await db.ChannelMessageView.findOne({ where: { channel_message_uuid } });
        if (!channelMessage) throw new ControllerError(500, 'Channel Message not found');

        /**
          * Broadcast the channel message to all users
          * in the room where the channel message was deleted.
          */
        broadcastChannel(`channel-${channel_uuid}`, 'chat_message_created', channelMessageDto(channelMessage));
    }
}

const service = new Service();

export default service;
