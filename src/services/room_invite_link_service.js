import model from '../models/room_invite_link.js';
import dto from '../dtos/room_invite_link.js';
import ControllerError from '../errors/controller_error.js';
import RoomService from './room_service.js';
import RoomPermissionService from './room_permission_service.js';

/**
 * @class RoomInviteLinkService
 * @description service class for room invite links.
 * @exports RoomInviteLinkService
 */
class RoomInviteLinkService {

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
     * @description Find a room invite link by primary key.
     * @param {Object} options
     * @param {String} options.pk
     * @returns {Promise<Object>}
     */
    async findOne(options = { pk: null }) {
        const { pk } = options;

        return await model
            .throwIfNotPresent(pk, 'Primary key value is required')
            .find()
            .where(model.pk, pk)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();
    }

    /**
     * @function findAll
     * @description Find all room invite links for the room.
     * @param {Object} options
     * @param {Number} options.page
     * @param {Number} options.limit
     * @param {String} options.room_uuid
     * @param {Object} options.user
     * @returns {Promise<Array>}
     */
    async findAll(options = { page: null, limit: null, room_uuid: null, user: null }) {
        const { page, limit, room_uuid, user } = options;

        /**
         * Ensure that the room_uuid and user are present.
         */
        await model
            .throwIfNotPresent(room_uuid, 'room_uuid is required')
            .throwIfNotPresent(user, 'User is required');

        /**
         * Only members of the room can view the room invite links.
         */
        if (!await RoomPermissionService.isUserInRoom({ room_uuid, user, room_role_name: null }))
            throw new ControllerError(403, 'Forbidden');

        /**
         * Find all room invite links for the room.
         */
        return await model
            .find({page, limit })
            .where('room_uuid', room_uuid)
            .include(RoomService.model, 'uuid', 'room_uuid')
            .orderBy('roominvitelink.created_at DESC')
            .dto(dto)
            .meta()
            .execute();
    }

    /**
     * @function create
     * @description Create a room invite link.
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
         * and a room invite link with the same primary key
         * does not already exist.
         */
        await model
            .throwIfNotPresent(body, 'Resource body is required')
            .throwIfNotPresent(body.room_uuid, 'room_uuid is required')
            .throwIfNotPresent(body.uuid, 'uuid is required')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where(model.pk, body.uuid)
            .throwIfFound()
            .executeOne();

        /**
         * Ensure the user is an admin of the room.
         */
        if (!await RoomPermissionService.isUserInRoom({ 
            room_uuid: body.room_uuid, 
            user, 
            room_role_name: 'Admin' 
        })) throw new ControllerError(403, 'Forbidden');

        /**
         * Create the room invite link.
         */
        await this.model
            .create({ body })
            .transaction(transaction)
            .execute();

        /**
         * Return the created room invite link.
         */
        return await this.findOne({ pk: body.uuid });
    }

    /**
     * @function update
     * @description Update a room invite link.
     * @param {Object} options
     * @param {String} options.pk
     * @param {Object} options.body
     * @param {Object} options.user
     * @param {Object} transaction
     * @returns {Promise<Object>}
     */
    async update(options = { pk: null, body: null, user: null }, transaction) {
        const { pk, body, user } = options;

        /**
         * Get the room invite link to be updated.
         */
        const roomInviteLink = await model
            .throwIfNotPresent(pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(body, 'Resource body is required')
            .throwIfNotPresent(user, 'User is required')
            .throwIfPresent(body.room_uuid, 'room_uuid cannot be updated')
            .find()
            .where(model.pk, pk)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();
        
        /**
         * Ensure the user is an admin of the room.
         */
        if (!await RoomPermissionService.isUserInRoom({ 
            room_uuid: roomInviteLink.room_uuid,
            user, 
            room_role_name: 'Admin' 
        })) throw new ControllerError(403, 'Forbidden');

        /**
         * set the room_uuid to the room_invite_link_room_uuid
         */
        body.room_uuid = roomInviteLink.room_uuid;

        /**
         * Update the room invite link.
         */
        await model
            .update({ body })
            .where(model.pk, pk)
            .transaction(transaction)
            .execute();
    }

    /**
     * @function destroy
     * @description Destroy a room invite link.
     * @param {Object} options
     * @param {String} options.pk
     * @param {Object} options.user
     * @param {Object} transaction
     * @returns {Promise<void>}
     */
    async destroy(options = { pk: null, user: null }, transaction) {
        const { pk, user } = options;

        /**
         * Get the room invite link to be destroyed.
         */
        const roomInviteLink = await model
            .throwIfNotPresent(pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where(model.pk, pk)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();

        /**
         * Ensure the user is an admin of the room.
         */
        if (!await RoomPermissionService.isUserInRoom({ 
            room_uuid: roomInviteLink.room_uuid, 
            user, 
            room_role_name: 'Admin' 
        })) throw new ControllerError(403, 'Forbidden');

        /**
         * Destroy the room invite link.
         */
        await model
            .destroy()
            .where(model.pk, pk)
            .transaction(transaction)
            .execute();
    }

    /**
     * @function destroyAll
     * @description Destroy all room invite links for the room.
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Object} transaction
     * @returns {Promise<void>}
     */
    async destroyAll(options = { room_uuid: null }, transaction) {
        /**
         * Destroy all user rooms for the room.
         */
        await model
            .destroy()
            .where('room_uuid', options.room_uuid)
            .transaction(transaction)
            .execute();
    }
}

// Create a new service
const service = new RoomInviteLinkService();

// Export the service
export default service;
