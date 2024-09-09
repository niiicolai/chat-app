
import ControllerError from '../errors/controller_error.js';
import model from '../models/user_room.js';
import dto from '../dtos/user_room.js';
import RoomPermissionService from './room_permission_service.js';
import UserService from './user_service.js';

/**
 * @class UserRoomService
 * @description CRUD service for user rooms.
 * @exports UserRoomService
 * @requires ControllerError
 * @requires model
 * @requires dto
 * @requires RoomPermissionService  
 * @requires UserService
 */
class UserRoomService {

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
     * @function count
     * @description Count the number of user rooms where the options are met.
     * @param {Object} options
     * @param {Object} options.where
     * @returns {Promise<Number>}
     */
    async count(options={ where: {} }) {
        const where = options.where || {};
        const arr = Object.keys(where) || []; 

        return await model
            .count()
            .each(arr, (key, subOptions) => {
                if (subOptions.where) {
                    return { where: { [key]: { value: where[key] }, ...subOptions.where }}
                }

                return { where: { [key]: { value: where[key] } }}
            })
            .execute();
    }

    /**
     * @function findOne
     * @description Find a user room by room_uuid and user_uuid.
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Object} options.user
     * @returns {Promise<Object>}
     */
    async findOne(options={ room_uuid: null, user: null }) {
        const { room_uuid, user } = options;

        return await model
            .throwIfNotPresent(room_uuid, 'room_uuid is required')
            .throwIfNotPresent(user, 'user is required')
            .find()
            .where('room_uuid', room_uuid)
            .where('user_uuid', user.sub)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();
    }

    /**
     * @function findAll
     * @description Find all user rooms by room_uuid.
     * @param {Object} options
     * @param {Number} options.page
     * @param {Number} options.limit
     * @param {String} options.room_uuid
     * @param {Object} options.where
     * @returns {Promise<Array>}
     */
    async findAll(options={ page: null, limit: null, room_uuid: null, where: {} }) {
        const { page, limit, room_uuid } = options;
        const where = options.where || {};
        
        return await model
            .throwIfNotPresent(room_uuid, 'room_uuid is required')
            .find({ page, limit })
            .include(UserService.model, 'uuid', 'user_uuid')
            .each(Object.keys(where), (data, options) => {
                options.where(data.key, data.value, data.operator); 
            })
            .where('room_uuid', room_uuid)
            .orderBy('userroom.created_at DESC')
            .dto(dto)
            .meta()
            .execute();
    }

    async create(options = { body: null, user: null }, transaction) {
        const { body, user } = options;

        /**
         * Ensure the necessary fields are present
         * and a user room with the same primary key
         * does not already exist.
         */
        await model
            .throwIfNotPresent(body, 'Resource body is required')
            .throwIfNotPresent(body.room_uuid, 'room_uuid is required')
            .throwIfNotPresent(body.room_role_name, 'room_role_name is required')
            .throwIfNotPresent(body.uuid, 'uuid is required')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where(model.pk, body.uuid)
            .throwIfFound()
            .executeOne();

        /**
         * Ensure the user is in the room 
         * before creating the user room.
         */
        await this.model
            .create({ body: { ...body, user_uuid: user.sub } })
            .transaction(transaction)
            .execute();

        /**
         * No need to return the created user room,
         * because it is not needed in the controller.
         */
    }

    async update(options = { pk: null, body: null, user: null }, transaction) {
        const { pk, body, user } = options;

        /**
         * Get the user room to be updated.
         */
        const userRoom = await model
            .throwIfNotPresent(pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(body, 'Resource body is required')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where(model.pk, pk)
            .throwIfNotFound()
            .executeOne();

        /**
         * Check if the user is in the room
         * as an admin before updating the user room.
         */
        if (!RoomPermissionService.isUserInRoom({ 
            room_uuid: userRoom.room_uuid,
            user,
            room_role_name: 'Admin'
        })) throw new ControllerError(404, 'User is not in the room');

        /**
         * Update the user room.
         */
        await model.update({ body })
            .where(model.pk, pk)
            .transaction(transaction)
            .execute();
    }

    async destroy(options = { pk: null, user: null }, transaction) {
        const { pk, user } = options;

        /**
         * Get the user room to be destroyed.
         */
        const userRoom = await model
            .throwIfNotPresent(pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where(model.pk, pk)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();
            
        /**
         * Check if the user has the right to destroy the user room.
         * (Must be an admin of the room).
         * TODO: Add a check to see if the user is the only admin in the room.
         */
        console.log("TODO: Add a check to see if the user is the only admin in the room.");
        if (userRoom.role_name === 'Admin') {
            throw new ControllerError(400, 'Admin cannot be removed from the room');
        }

        /**
         * Check if the user is in the room
         * as an admin before destroying the user room.
         */
        if (!RoomPermissionService.isUserInRoom({ 
            room_uuid: userRoom.room_uuid,
            user,
            room_role_name: 'Admin'
        })) throw new ControllerError(404, 'User is not in the room');

        /**
         * Destroy the user room.
         */
        await model
            .destroy()
            .where(model.pk, pk)
            .transaction(transaction)
            .execute();
    }

    /**
     * @function destroyAll
     * @description Destroy all user rooms for the room.
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

const service = new UserRoomService();

export default service;
