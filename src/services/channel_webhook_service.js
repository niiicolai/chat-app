import ControllerError from '../errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import ChannelService from './channel_service.js';
import ChannelMessageService from './channel_message_service.js';
import model from '../models/channel_webhook.js';
import dto from '../dtos/channel_webhook.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @class ChannelWebhookService
 * @description service class for channel webhook
 * @exports ChannelWebhookService
 */
class ChannelWebhookService {

    /**
     * @constructor
     */
    constructor() {
        this.model = model;
        this.dto = dto;
    }

    /**
     * @function template
     * @description Return the model template.
     * @returns {Object}
     */
    template() {
        return this.model.template();
    }

    /**
     * @function findOne
     * @description Find a channel webhook by primary key and user.
     * @param {Object} options
     * @param {String} options.pk
     * @param {Object} options.user
     * @returns {Promise<Object>}
     */
    async findOne(options = { pk: null, user: null }, skipPermissionCheck = false) {
        const { pk, user } = options;

        /**
         * Ensure the necessary fields are present
         */
        await model.throwIfNotPresent(pk, 'uuid is required')

        if (!skipPermissionCheck)
            await model.throwIfNotPresent(user, 'user is required')

        /**
         * Find the channel webhook by primary key.
         */
        const channelWebhook = await model
            .find()
            .where(model.pk, pk)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();

        /**
         * Ensure the user and channel are 'admin in the room
         * where the channel is being retrieved.
         */
        if (!skipPermissionCheck && !await RoomPermissionService.isUserAndChannelInRoom({
            channel_uuid: channelWebhook.channel_uuid, user, room_role_name: 'Admin'
        })) throw new ControllerError(403, 'Forbidden');

        return channelWebhook;
    }

    /**
     * @function findAll
     * @description Find all channel webhooks by room_uuid and user.
     * @param {Object} options
     * @param {Number} options.page
     * @param {Number} options.limit
     * @param {String} options.room_uuid
     * @param {Object} options.user
     * @returns {Promise<Array>}
     */
    async findAll(options = { page: null, limit: null, room_uuid: null, user: null }, skipPermissionCheck = false) {
        const { page, limit, room_uuid, user } = options;
        /**
         * Ensure the necessary fields are present
         */
        await model.throwIfNotPresent(options.room_uuid, 'room_uuid is required')

        if (!skipPermissionCheck) {
            await model.throwIfNotPresent(user, 'user is required')
        }

        /**
         * Ensure the user is in the room.
         */
        if (!skipPermissionCheck && !await RoomPermissionService.isUserInRoom({
            room_uuid,
            user,
            room_role_name: null
        })) throw new ControllerError(403, 'Forbidden');

        /**
         * Find all channel webhooks in the room and return them.
         */
        return await model
            .find({ page, limit })
            .include(ChannelService.model, 'uuid', 'channel_uuid')
            .where('room_uuid', room_uuid)
            .orderBy('channelwebhook.created_at DESC')
            .dto(dto)
            .meta()
            .execute();
    }

    /**
     * @function event
     * @description Executed when a channel webhook event is triggered.
     * @param {Object} options
     * @param {String} options.pk
     * @param {Object} options.body
     * @param {Object} options.user
     * @param {Object} transaction
     * @returns {Promise<Object>}
     */
    async event(options = { pk: null, body: null }, transaction) {
        const { pk, body } = options;

        /**
         * Ensure the necessary fields are present
         * and that the channel webhook exist.
         */
        const webhook = await model
            .throwIfNotPresent(pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(body, 'Resource body is required')
            .throwIfNotPresent(body.message, 'message is required')
            .find()
            .where('channelwebhook.uuid', pk)
            .include(ChannelService.model, 'uuid', 'channel_uuid')
            .throwIfNotFound('Channel webhook not found')
            .executeOne();


        /**
         * Create the channel message.
         */
        await ChannelMessageService.create({
            body: {
                uuid: uuidv4(),
                channel_uuid: webhook.channel_uuid,
                body: body.message,
                user_uuid: null
            },
            user: null
        }, transaction, 1, true);

        /**
         * Return the channel webhook that was created.
         */
        return await this.findOne({ pk, user: null }, true);
    }

    /**
     * @function create
     * @description Create a channel webhook.
     * @param {Object} options
     * @param {Object} options.body
     * @param {Object} options.user
     * @param {Object} transaction
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, user: null }, transaction) {
        const { body, user } = options;

        /**
         * Ensure the necessary fields are present
         * and that the channel webhook does not already exist.
         */
        await model
            .throwIfNotPresent(body, 'Resource body is required')
            .throwIfNotPresent(body.channel_uuid, 'channel_uuid is required')
            .throwIfNotPresent(body.uuid, 'uuid is required')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where('uuid', body.uuid)
            .throwIfFound('A channel webhook with the same uuid already exists')
            .executeOne();

        await model
            .find()
            .where('channel_uuid', body.channel_uuid)
            .throwIfFound('The channel already has a webhook')
            .executeOne();

        /**
         * Ensure the user is an admin in the room
         * before creating the channel.
         */
        if (!await RoomPermissionService.isUserAndChannelInRoom({
            channel_uuid: body.channel_uuid,
            user,
            room_role_name: 'Admin'
        })) throw new ControllerError(403, 'Forbidden');

        /**
         * Create the channel webhook.
         */
        await model
            .create({ body })
            .transaction(transaction)
            .execute();

        /**
         * Return the channel webhook that was created.
         */
        return await this.findOne({ pk: body.uuid, user });
    }

    /**
     * @function update
     * @description Update a channel webhook.
     * @param {Object} options
     * @param {String} options.pk
     * @param {Object} options.body
     * @param {Object} options.body.channel_uuid
     * @param {Object} options.user
     * @param {Object} transaction
     * @returns {Promise}
     */
    async update(options = { pk: null, body: null, user: null }, transaction) {
        const { pk, body, user } = options;

        /**
         * Get the channel webhook to be updated
         * and ensure the necessary fields are present.
         */
        await model
            .throwIfNotPresent(pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(body, 'Resource body is required')
            .throwIfNotPresent(body.channel_uuid, 'channel_uuid is required')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where(model.pk, pk)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();

        await model
            .find()
            .where('channel_uuid', body.channel_uuid)
            .throwIfFound('The channel already has a webhook')
            .executeOne();

        /**
         * Check if the user has the right to update the channel webhook.
         * (Must be an admin of the room).
         */
        if (!await RoomPermissionService.isUserAndChannelInRoom({
            channel_uuid: body.channel_uuid,
            user,
            room_role_name: 'Admin'
        })) throw new ControllerError(403, 'Forbidden');

        /**
         * Update the channel webhook.
         */
        await model
            .update({ body })
            .where(model.pk, pk)
            .transaction(transaction)
            .execute();
    }

    /**
     * @function destroy
     * @description Destroy a channel webhook.
     * @param {Object} options
     * @param {String} options.pk
     * @param {Object} options.user
     * @param {Object} transaction
     * @returns {Promise}
     */
    async destroy(options = { pk: null, user: null }, transaction) {
        const { pk, user } = options;

        /**
         * Get the channel webhook to be destroyed.
         */
        const channelWebhook = await model
            .throwIfNotPresent(pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where(model.pk, pk)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();

        /**
         * Check if the user has the right to destroy the channel.
         * (Must be an admin of the room).
         */
        if (!await RoomPermissionService.isUserAndChannelInRoom({
            channel_uuid: channelWebhook.channel_uuid,
            user,
            room_role_name: 'Admin'
        })) throw new ControllerError(403, 'Forbidden');

        /**
         * Destroy the channel webhook
         */
        await model
            .destroy()
            .where(model.pk, pk)
            .transaction(transaction)
            .execute();
    }
}

const service = new ChannelWebhookService();

export default service;
