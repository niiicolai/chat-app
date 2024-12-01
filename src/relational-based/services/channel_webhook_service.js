import ChannelWebhookServiceValidator from '../../shared/validators/channel_webhook_service_validator.js';
import ExceedsRoomTotalFilesLimitError from '../../shared/errors/exceeds_room_total_files_limit_error.js';
import ExceedsSingleFileSizeError from '../../shared/errors/exceeds_single_file_size_error.js';
import BroadcastChannelService from '../../shared/services/broadcast_channel_service.js';
import EntityNotFoundError from '../../shared/errors/entity_not_found_error.js';
import RoomMemberRequiredError from '../../shared/errors/room_member_required_error.js';
import AdminPermissionRequiredError from '../../shared/errors/admin_permission_required_error.js';
import DuplicateEntryError from '../../shared/errors/duplicate_entry_error.js';
import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import channelMessageDto from '../dto/channel_message_dto.js';
import RPS from './room_permission_service.js';
import dto from '../dto/channel_webhook_dto.js';
import db from '../sequelize/models/index.cjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * @constant storage
 * @description Storage service instance for channel webhook avatars.
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
        ChannelWebhookServiceValidator.findOne(options);

        const entity = await db.ChannelWebhookView.findByPk(options.uuid);
        if (!entity) throw new EntityNotFoundError('channel_webhook');

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid: entity.channel_uuid, user: options.user, role_name: null });
        if (!isInRoom) throw new RoomMemberRequiredError();

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
        options = ChannelWebhookServiceValidator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        const room = await db.RoomView.findOne({ uuid: room_uuid });
        if (!room) throw new EntityNotFoundError('room');

        const isInRoom = await RPS.isInRoom({ room_uuid, user, role_name: null });
        if (!isInRoom) throw new RoomMemberRequiredError();

        const [total, data] = await Promise.all([
            db.ChannelWebhookView.count({ room_uuid }),
            db.ChannelWebhookView.findAll({
                where: { room_uuid },
                ...(limit && { limit }),
                ...(offset && { offset })
            })
        ]);

        return {
            data: data.map(entity => dto(entity)),
            total,
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
        ChannelWebhookServiceValidator.create(options);

        const { body, file, user } = options;
        const { uuid, name, description, channel_uuid } = body;

        await db.sequelize.transaction(async (transaction) => {
            const channel = await Promise.all([
                db.ChannelView.findOne({ where: { channel_uuid }, transaction }),
                db.ChannelWebhookView.findOne({ where: { channel_webhook_uuid: uuid }, transaction }),
                db.ChannelWebhookView.findOne({ where: { channel_uuid }, transaction }),
                RPS.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }, transaction),
            ]).then(([channel, uuidInUse, duplicateChannelWebhook, isAdmin]) => {
                if (!channel) throw new EntityNotFoundError('channel');
                if (!isAdmin) throw new AdminPermissionRequiredError();
                if (uuidInUse) throw new DuplicateEntryError('channel_webhook', 'UUID', uuid);
                if (duplicateChannelWebhook) throw new DuplicateEntryError('channel_webhook', 'channel_uuid', channel_uuid);
                return channel;
            });

            if (file && file.size > 0) {
                await Promise.all([
                    RPS.fileExceedsTotalFilesLimit({ room_uuid: channel.room_uuid, bytes: file.size }, transaction),
                    RPS.fileExceedsSingleFileSize({ room_uuid: channel.room_uuid, bytes: file.size }, transaction)
                ]).then(([exceedsTotalFiles, exceedsSingleFileSize]) => {
                    if (exceedsTotalFiles) throw new ExceedsRoomTotalFilesLimitError();
                    if (exceedsSingleFileSize) throw new ExceedsSingleFileSizeError();
                });
            }

            await db.ChannelWebhookView.createChannelWebhookProc({
                uuid,
                name,
                description,
                channel_uuid,
                room_uuid: channel.room_uuid,
                bytes: (file && file.size > 0 ? file.size : null),
                src: (file && file.size > 0 ? await storage.uploadFile(file, uuid) : null)
            }, transaction);
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
        ChannelWebhookServiceValidator.update(options);

        const { uuid, body, file, user } = options;
        const { name, description } = body;

        await db.sequelize.transaction(async (transaction) => {
            const channelWebhook = await db.ChannelWebhookView.findByPk(uuid, { transaction });
            if (!channelWebhook) throw new EntityNotFoundError('channel_webhook');

            await RPS.isInRoomByChannel(
                { channel_uuid: channelWebhook.channel_uuid, user, role_name: 'Admin' },
                transaction
            ).then((isAdmin) => { 
                if (!isAdmin) throw new AdminPermissionRequiredError(); 
            });

            if (file && file.size > 0) {
                await Promise.all([
                    RPS.fileExceedsTotalFilesLimit({ room_uuid: channelWebhook.room_uuid, bytes: file.size }, transaction),
                    RPS.fileExceedsSingleFileSize({ room_uuid: channelWebhook.room_uuid, bytes: file.size }, transaction)
                ]).then(([exceedsTotalFiles, exceedsSingleFileSize]) => {
                    if (exceedsTotalFiles) throw new ExceedsRoomTotalFilesLimitError();
                    if (exceedsSingleFileSize) throw new ExceedsSingleFileSizeError();
                });
            }

            await channelWebhook.editChannelWebhookProc({
                ...(name && { name }),
                ...(description && { description }),
                ...(file && file.size > 0 && {
                    bytes: file.size,
                    src: await storage.uploadFile(file, uuid)
                }),
            }, transaction);

            // Old room file must be deleted last to prevent deleting a file
            // on the object storage and then failing to update the database.
            // This would result in an inconsistent state.
            if (file && file.size > 0 && channelWebhook.room_file_uuid) {
                await db.RoomFileView.deleteRoomFileProcStatic({ uuid: channelWebhook.room_file_uuid }, transaction);
                await storage.deleteFile(storage.parseKey(channelWebhook.room_file_src));
            }
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
        ChannelWebhookServiceValidator.destroy(options);

        const { uuid, user } = options;

        await db.sequelize.transaction(async (transaction) => {
            const channelWebhook = await db.ChannelWebhookView.findByPk(uuid, { transaction });
            if (!channelWebhook) throw new EntityNotFoundError('channel_webhook');

            await RPS.isInRoomByChannel(
                { channel_uuid: channelWebhook.channel_uuid, user, role_name: 'Admin' },
                transaction
            ).then((isAdmin) => {
                if (!isAdmin) throw new AdminPermissionRequiredError();
            });

            await channelWebhook.deleteChannelWebhookProc(transaction);

            if (channelWebhook.room_file_uuid) {
                const key = storage.parseKey(channelWebhook.room_file_src);
                await storage.deleteFile(key);
            }
        });
    }

    /**
     * @function message
     * @description Send a message to a channel webhook.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.body
     * @param {string} options.body.message
     * @returns {Promise<void>}
     */
    async message(options = { uuid: null, body: null }) {
        ChannelWebhookServiceValidator.message(options);

        const { uuid, body } = options;
        const { message } = body;
        const channel_message_uuid = uuidv4();

        await db.sequelize.transaction(async (transaction) => {
            const channelWebhook = await db.ChannelWebhookView.findByPk(uuid, { transaction });
            if (!channelWebhook) throw new EntityNotFoundError('channel_webhook');

            await channelWebhook.createChannelWebhookMessageProc({
                message,
                channel_message_uuid,
                channel_webhook_message_type_name: 'Custom'
            }, transaction);
        });

        const channelMessage = await db.ChannelMessageView.findOne({ where: { channel_message_uuid } });
        if (!channelMessage) throw new ControllerError(500, 'Channel Message not found');

        BroadcastChannelService.create(channelMessageDto(channelMessage));
    }
}

const service = new ChannelWebhookService();

export default service;
