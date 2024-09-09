import ControllerError from '../errors/controller_error.js';
import ChannelMessageService from './channel_message_service.js';
import RoomSettingService from './room_setting_service.js';
import RoomPermissionService from './room_permission_service.js';
import model from '../models/channel.js';
import dto from '../dtos/channel.js';

/**
 * @class ChannelService
 * @description service class for channels.
 * @exports ChannelService
 */
class ChannelService {

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
     * @description Find a channel by primary key and user.
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
         * Ensure the user and channel are in the room
         * where the channel is being retrieved.
         */
        if (!skipPermissionCheck && !await RoomPermissionService.isUserAndChannelInRoom({
            channel_uuid: pk, user, room_role_name: null
        })) throw new ControllerError(403, 'Forbidden');

        /**
         * Find the channel and return it.
         */
        return await model
            .find()
            .where(model.pk, pk)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();
    }

    /**
     * @function findAll
     * @description Find all channels by room_uuid and user.
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
         * Find all channels in the room and return them.
         */
        return await model
            .find({ page, limit })
            .where('room_uuid', room_uuid)
            .orderBy('channel.created_at DESC')
            .dto(dto)
            .meta()
            .execute();
    }

    /**
     * @function create
     * @description Create a channel.
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
         * and that the channel does not already exist.
         */
        await model
            .throwIfNotPresent(body, 'Resource body is required')
            .throwIfNotPresent(body.name, 'name is required')
            .throwIfNotPresent(body.description, 'description is required')
            .throwIfNotPresent(body.room_uuid, 'room_uuid is required')
            .throwIfNotPresent(body.channel_type_name, 'channel_type_name is required')
            .throwIfNotPresent(body.uuid, 'uuid is required')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where('uuid', body.uuid)
            .throwIfFound('A channel with the same uuid already exists')
            .executeOne();

        /**
         * Ensure the channel name and type are unique in the room.
         */
        await this.model
            .find()
            .where('name', body.name)
            .where('channel_type_name', body.channel_type_name)
            .where('room_uuid', body.room_uuid)
            .throwIfFound('A channel with the same name and type already exists')
            .executeOne();

        /**
         * Ensure the user is an admin in the room
         * before creating the channel.
         */
        if (!await RoomPermissionService.isUserInRoom({
            room_uuid: body.room_uuid,
            user,
            room_role_name: 'Admin'
        })) throw new ControllerError(403, 'Forbidden');

        /**
         * Get the room setting and count the channels in the room.
         * And ensure the channel limit has not been reached.
         */
        const roomSetting = await RoomSettingService.findOne({ room_uuid: body.room_uuid });
        const channelsCount = await model.count().where('room_uuid', body.room_uuid).execute();
        if (channelsCount >= roomSetting.max_channels) throw new ControllerError(400, 'Room channel limit reached');

        /**
         * Create the channel.
         */
        await model
            .create({ body })
            .transaction(transaction)
            .execute();

        /**
         * Return the channel that was created.
         */
        return await this.findOne({ pk: body.uuid, user });
    }

    /**
     * @function update
     * @description Update a channel.
     * @param {Object} options
     * @param {String} options.pk
     * @param {Object} options.body
     * @param {Object} options.user
     * @param {Object} transaction
     * @returns {Promise}
     */
    async update(options = { pk: null, body: null, user: null }, transaction) {
        const { pk, body, user } = options;

        /**
         * Get the channel to be updated
         * and ensure the necessary fields are present.
         */
        const channel = await model
            .throwIfNotPresent(pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(body, 'Resource body is required')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where(model.pk, pk)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();

        /**
         * Check if the user has the right to update the channel.
         * (Must be an admin of the room).
         */
        if (!await RoomPermissionService.isUserInRoom({
            room_uuid: channel.room_uuid,
            user,
            room_role_name: 'Admin'
        })) throw new ControllerError(403, 'Forbidden');

        /**
         * Update the channel.
         */
        await model
            .update({ body })
            .where(model.pk, pk)
            .transaction(transaction)
            .execute();
    }

    /**
     * @function destroy
     * @description Destroy a channel.
     * @param {Object} options
     * @param {String} options.pk
     * @param {Object} options.user
     * @param {Object} transaction
     * @returns {Promise}
     */
    async destroy(options = { pk: null, user: null }, transaction) {
        const { pk, user } = options;

        /**
         * Get the channel to be destroyed.
         */
        const channel = await model
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
        if (!await RoomPermissionService.isUserInRoom({
            room_uuid: channel.room_uuid,
            user,
            room_role_name: 'Admin'
        })) throw new ControllerError(403, 'Forbidden');

        /**
         * Destroy the channel and all its messages.
         * (All in a transaction, so if something goes wrong, the changes are rolled back).
         */
        await model.defineTransaction(async (t) => {
            await RoomSettingService.clearJoinChannel({ join_channel_uuid: pk }, t);
            await ChannelMessageService.destroyAllByChannelUuid({ channel_uuid: pk }, t);
            await model
                .destroy()
                .where(model.pk, pk)
                .transaction(t)
                .execute();
        }, transaction);
    }

    /**
     * @function destroyAll
     * @description Destroy all channels for a room.
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Object} transaction
     * @returns {Promise<void>}
     */
    async destroyAll(options = { room_uuid: null }, transaction) {
        const { room_uuid } = options;
        if (!room_uuid) throw new ControllerError(400, 'room_uuid is required');

        await model.defineTransaction(async (t) => {
            await ChannelMessageService.destroyAllByRoomUuid({ room_uuid }, t);
            await model
                .destroy()
                .where('room_uuid', room_uuid)
                .transaction(t)
                .execute();
        }, transaction);
    }
}

const service = new ChannelService();

export default service;
