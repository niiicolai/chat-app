import Validator from '../../shared/validators/channel_webhook_service_validator.js';
import BroadcastChannelService from '../../shared/services/broadcast_channel_service.js';
import StorageService from '../../shared/services/storage_service.js';
import err from '../../shared/errors/index.js';
import RPS from './room_permission_service.js';
import dto from '../dto/channel_webhook_dto.js';
import dtoCM from '../dto/channel_message_dto.js';
import db from '../sequelize/models/index.cjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * @constant storage
 * @description Storage service instance
 * @type {StorageService}
 */
const storage = new StorageService('channel_webhook_avatar');

/**
 * @class ChannelWebhookService
 * @description Service class for channel webhooks.
 * @exports ChannelWebhookService
 */
class ChannelWebhookService {

    /**
     * @function findOne
     * @description Find a channel webhook by UUID.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const { uuid, user } = options;
        const entity = await db.ChannelWebhookView.findByPk(uuid);
        if (!entity) throw new err.EntityNotFoundError('channel_webhook');

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid: entity.channel_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto(entity);
    }

    /**
     * @function findAll
     * @description Find all channel webhooks in a room.
     * @param {Object} options
     * @param {string} options.room_uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @param {number} options.page
     * @param {number} options.limit
     * @returns {Promise<Object>}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = Validator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        const room = await db.RoomView.findOne({ uuid: room_uuid });
        if (!room) throw new err.EntityNotFoundError('room');

        const isInRoom = await RPS.isInRoom({ room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const [total, data] = await Promise.all([
            db.ChannelWebhookView.count({ room_uuid }),
            db.ChannelWebhookView.findAll({
                where: { room_uuid },
                ...(limit && { limit }),
                ...(offset && { offset })
            })
        ]);

        return {
            total,
            data: data.map(entity => dto(entity)),
            ...(limit && { limit }),
            ...(page && { page }),
            ...(page && { pages: Math.ceil(total / limit) })
        };
    }

    /**
     * @function create
     * @description Create a channel webhook.
     * @param {Object} options
     * @param {Object} options.body
     * @param {string} options.body.uuid
     * @param {string} options.body.name
     * @param {string} options.body.description
     * @param {string} options.body.channel_uuid
     * @param {Object} options.file optional
     * @param {Object} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, file: null, user: null }) {
        Validator.create(options);

        const { body, file, user } = options;
        const { uuid, name, description, channel_uuid } = body;

        const channel = await Promise.all([
            db.ChannelView.findOne({ where: { channel_uuid } }),
            db.ChannelWebhookView.findOne({ where: { channel_uuid } }),
            RPS.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }),
        ]).then(([channel, channelHasWebhook, isAdmin]) => {
            if (!channel) throw new err.EntityNotFoundError('channel');
            if (!isAdmin) throw new err.AdminPermissionRequiredError();
            if (channelHasWebhook) throw new err.ControllerError(400, 'channel already has a webhook');
            return channel;
        });

        const room_uuid = channel.room_uuid;
        const room_file_src = await this.createAvatar({ uuid, room_uuid, file });

        await db.sequelize.transaction(async (transaction) => {
            const room_file_uuid = (room_file_src ? uuidv4() : null);
            if (room_file_src) {
                await db.RoomFileView.createRoomFileProcStatic({
                    room_file_uuid,
                    room_file_src,
                    room_file_size: file.size,
                    room_uuid: room_uuid,
                    room_file_type_name: 'ChannelWebhookAvatar',
                }, transaction);
            }

            await db.ChannelWebhookView.createChannelWebhookProc({
                uuid,
                name,
                description,
                channel_uuid,
                room_uuid,
                ...(room_file_uuid && { room_file_uuid }),
            }, transaction);

        }).catch((error) => {
            // Delete the avatar file if it was uploaded
            if (room_file_src) storage.deleteFile(storage.parseKey(room_file_src));

            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new err.DuplicateEntryError('channel', error.errors[0].path, error.errors[0].value);
            } else if (error.name === 'SequelizeForeignKeyConstraintError') {
                throw new err.EntityNotFoundError(error.fields[0]);
            }

            throw error;
        });

        return await db.ChannelWebhookView
            .findByPk(uuid)
            .then((channelWebhook) => dto(channelWebhook));
    }

    /**
     * @function update
     * @description Update a channel webhook.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.body
     * @param {string} options.body.name optional
     * @param {string} options.body.description optional
     * @param {Object} options.file optional
     * @param {Object} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async update(options = { uuid: null, body: null, file: null, user: null }) {
        Validator.update(options);

        const { uuid, body, file, user } = options;
        const { name, description } = body;

        const channelWebhook = await db.ChannelWebhookView.findByPk(uuid);
        if (!channelWebhook) throw new err.EntityNotFoundError('channel_webhook');

        const channel_uuid = channelWebhook.channel_uuid;
        const isAdmin = await RPS.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const room_uuid = channelWebhook.room_uuid;
        const room_file_src = await this.createAvatar({ uuid, room_uuid, file });

        await db.sequelize.transaction(async (transaction) => {
           
            const newRoomFileUuid = (room_file_src ? uuidv4() : null);
            const oldRoomFileUuid = channelWebhook.room_file_uuid;
            if (room_file_src) {
                await db.RoomFileView.createRoomFileProcStatic({
                    room_file_uuid: newRoomFileUuid,
                    room_file_src,
                    room_file_size: file.size,
                    room_uuid: room_uuid,
                    room_file_type_name: 'ChannelWebhookAvatar',
                }, transaction);
            }

            await channelWebhook.editChannelWebhookProc({
                ...(name && { name }),
                ...(description && { description }),
                ...(newRoomFileUuid && { room_file_uuid: newRoomFileUuid }),
            }, transaction);

            if (room_file_src && oldRoomFileUuid && channelWebhook.room_file_src) {
                await db.RoomFileView.deleteRoomFileProcStatic({ uuid: oldRoomFileUuid }, transaction);
                await storage.deleteFile(storage.parseKey(channelWebhook.room_file_src));
            }

        }).catch((error) => {
            // Delete the avatar file if it was uploaded
            if (room_file_src) storage.deleteFile(storage.parseKey(room_file_src));

            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new err.DuplicateEntryError('channel', error.errors[0].path, error.errors[0].value);
            } else if (error.name === 'SequelizeForeignKeyConstraintError') {
                throw new err.EntityNotFoundError(error.fields[0]);
            }

            throw error;
        });

        return await db.ChannelWebhookView
            .findByPk(uuid)
            .then((channelWebhook) => dto(channelWebhook));
    }

    /**
     * @function destroy
     * @description Delete a channel webhook.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.user
     * @param {string} options.user.sub
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null, user: null }) {
        Validator.destroy(options);

        const { uuid, user } = options;

        await db.sequelize.transaction(async (transaction) => {
            const channelWebhook = await db.ChannelWebhookView.findByPk(uuid, { transaction });
            if (!channelWebhook) throw new err.EntityNotFoundError('channel_webhook');

            const channel_uuid = channelWebhook.channel_uuid;
            const isAdmin = await RPS.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }, transaction);
            if (!isAdmin) throw new err.AdminPermissionRequiredError();

            await channelWebhook.deleteChannelWebhookProc(transaction);

            if (channelWebhook.room_file_uuid) {
                await db.RoomFileView.deleteRoomFileProcStatic({ uuid: channelWebhook.room_file_uuid }, transaction);
                await storage.deleteFile(storage.parseKey(channelWebhook.room_file_src));
            }
        });
    }

    /**
     * @function message
     * @description Send a message to a channel connected to a webhook.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.body
     * @param {string} options.body.message
     * @returns {Promise<void>}
     */
    async message(options = { uuid: null, body: null }) {
        Validator.message(options);

        const { uuid, body } = options;
        const { message } = body;
        const channel_message_uuid = uuidv4();

        await db.sequelize.transaction(async (transaction) => {
            const channelWebhook = await db.ChannelWebhookView.findByPk(uuid, { transaction });
            if (!channelWebhook) throw new err.EntityNotFoundError('channel_webhook');

            await channelWebhook.createChannelWebhookMessageProc({
                message,
                channel_message_uuid,
                channel_webhook_message_type_name: 'Custom'
            }, transaction);
        });

        const channelMessage = await db.ChannelMessageView.findOne({ where: { channel_message_uuid } });
        if (!channelMessage) throw new err.ControllerError(500, 'Channel Message not found');

        const data = dtoCM(channelMessage);
        BroadcastChannelService.create(data);
    }

    /**
     * @function createAvatar
     * @description Create a channel webhook avatar (helper function)
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

const service = new ChannelWebhookService();

export default service;
