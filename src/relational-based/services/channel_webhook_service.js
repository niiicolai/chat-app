import Validator from '../../shared/validators/channel_webhook_service_validator.js';
import BroadcastChannelService from '../../shared/services/broadcast_channel_service.js';
import err from '../../shared/errors/index.js';
import RFS from './room_file_service.js';
import RPS from './room_permission_service.js';
import dto from '../dto/channel_webhook_dto.js';
import dtoCM from '../dto/channel_message_dto.js';
import db from '../sequelize/models/index.cjs';
import { v4 as uuidv4 } from 'uuid';

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

        await db.sequelize.transaction(async (transaction) => {
            const channel = await Promise.all([
                db.ChannelView.findOne({ where: { channel_uuid }, transaction }),
                RPS.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }, transaction),
            ]).then(([channel, isAdmin]) => {
                if (!channel) throw new err.EntityNotFoundError('channel');
                if (!isAdmin) throw new err.AdminPermissionRequiredError();
                return channel;
            });

            const room_uuid = channel.room_uuid;
            const room_file_body = { room_uuid, room_file_type_name: 'ChannelWebhookAvatar' };
            const room_file_uuid = (file && file.size > 0)
                ? (await RFS.create({ file, user, body: room_file_body }, transaction)).uuid
                : null;

            await db.ChannelWebhookView.createChannelWebhookProc({
                uuid,
                name,
                description,
                channel_uuid,
                room_uuid,
                ...(room_file_uuid && { room_file_uuid }),
            }, transaction);

        }).catch((error) => {
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

        await db.sequelize.transaction(async (transaction) => {
            const channelWebhook = await db.ChannelWebhookView.findByPk(uuid, { transaction });
            if (!channelWebhook) throw new err.EntityNotFoundError('channel_webhook');

            const channel_uuid = channelWebhook.channel_uuid;
            const isAdmin = await RPS.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }, transaction);
            if (!isAdmin) throw new err.AdminPermissionRequiredError();

            const room_uuid = channelWebhook.room_uuid;
            const room_file_body = { room_uuid, room_file_type_name: 'ChannelWebhookAvatar' };
            const room_file_uuid = (file && file.size > 0)
                ? (await RFS.create({ file, user, body: room_file_body }, transaction)).uuid
                : null;

            await channelWebhook.editChannelWebhookProc({
                ...(name && { name }),
                ...(description && { description }),
                ...(room_file_uuid && { room_file_uuid }),
            }, transaction);

            if (file && file.size > 0 && channelWebhook.room_file_uuid) {
                await RFS.remove(channelWebhook.room_file_uuid, channelWebhook.room_file_src, transaction);
            }

        }).catch((error) => {
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
                await RFS.remove(channelWebhook.room_file_uuid, channelWebhook.room_file_src, transaction);
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
}

const service = new ChannelWebhookService();

export default service;
