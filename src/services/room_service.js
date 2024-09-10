import UserRoomService from './user_room_service.js';
import RoomSettingService from './room_setting_service.js';
import RoomInviteLinkService from './room_invite_link_service.js';
import RoomPermissionService from './room_permission_service.js';
import ChannelService from './channel_service.js';
import StorageService from './storage_service.js';
import ControllerError from '../errors/controller_error.js';
import model from '../models/room.js';
import dto from '../dtos/room.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @constant storageService
 * @description Storage service to upload room avatars.
 */
const storageService = new StorageService('room_avatars');


/**
 * @class RoomService
 * @description CRUD service for room service.
 * @exports RoomService
 */
class RoomService {

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
     * @description Find a room by primary key and user.
     * @param {Object} options
     * @param {String} options.pk
     * @param {Object} options.user
     * @returns {Promise<Object>}
     */
    async findOne(options = { pk: null, user: null }) {
        const { pk, user } = options;

        return await model
            .throwIfNotPresent(pk, 'uuid is required')
            .throwIfNotPresent(user, 'user is required')
            .throwIfNotPresent(user.sub, 'user.sub is required')
            .find()
            .include(UserRoomService.model, 'room_uuid')
            .include(RoomSettingService.model, 'room_uuid')
            .where(`${model.mysql_table}.${model.pk}`, pk)
            .where('user_uuid', user.sub)            
            .throwIfNotFound()
            .dto(dto)
            .executeOne();
    }

    /**
     * @function findAll
     * @description Find all rooms for a user.
     * @param {Object} options
     * @param {Number} options.page
     * @param {Number} options.limit
     * @param {Object} options.user
     * @returns {Promise<Object>}
     */
    async findAll(options = { page: null, limit: null, user: null }) {
        const { page, limit, user } = options;

        return await model
            .throwIfNotPresent(user, 'user is required')
            .find({ page, limit })
            .where('user_uuid', user.sub)
            .include(UserRoomService.model, 'room_uuid')
            .include(RoomSettingService.model, 'room_uuid')
            .orderBy('room.created_at DESC')
            .dto(dto)
            .meta()
            .execute();
    }

    /**
     * @function create
     * @description Create a room.
     * @param {Object} options
     * @param {Object} options.body
     * @param {Object} options.user
     * @param {Object} options.file
     * @param {Object} transaction
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, user: null, file: null }, transaction) {
        const { body, user, file } = options;

        /**
         * Ensure the necessary fields are present
         * and that the room does not already exist.
         */
        await model
            .throwIfNotPresent(body, 'Resource body is required')
            .throwIfNotPresent(body.name, 'name is required')
            .throwIfNotPresent(body.description, 'description is required')
            .throwIfNotPresent(body.room_category_name, 'room_category_name is required')
            .throwIfNotPresent(body.uuid, 'uuid is required')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where(model.pk, body.uuid)
            .throwIfFound()
            .executeOne();

        /**
         * Ensure the room name is not already in use.
         */
        await model
            .find()
            .where('name', body.name)
            .throwIfFound('Room name is already in use')
            .executeOne();

        /**
         * if a file is present, upload it and set the avatar_src
         * field to the file path.
         */
        if (file) {
            body.avatar_src = await storageService.uploadFile(file, body.uuid);
        }

        /**
         * Create the room.
         * And a user room for the user with the role of Admin.
         * And a room setting for the room.
         * (in a transaction, so that if one fails, none are created)
         */
        await model.defineTransaction(async (t) => {
            await model.create({ body }).transaction(t).execute();
            await UserRoomService.create({
                body: { uuid: uuidv4(), room_uuid: body.uuid, user_uuid: user.sub, room_role_name: 'Admin' },
                user
            }, t);
            await RoomSettingService.create({
                body: { uuid: uuidv4(), room_uuid: body.uuid },
                user
            }, t);
        }, transaction);
        
        /**
         * Return the room that was created.
         */
        return await this.findOne({ pk: body.uuid, user });
    }

    /**
     * @function update
     * @description Update a room.
     * @param {Object} options
     * @param {String} options.pk
     * @param {Object} options.body
     * @param {Object} options.user
     * @param {Object} options.file
     * @param {Object} transaction
     * @returns {Promise}
     */
    async update(options = { pk: null, body: null, user: null, file: null }, transaction) {
        const { pk, body, user, file } = options;

        /**
         * Ensure the necessary fields are present
         * and that the room exists.
         */
        const room = await model
            .throwIfNotPresent(pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(body, 'Resource body is required')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where(model.pk, pk)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();

        /**
         * Ensure the room name is not already in use.
         * If the name is the same as the current name, 
         * skip this check.
         */
        if (body.name && body.name !== room.name) {
            await model
                .find()
                .where('name', body.name)
                .throwIfFound('Room name is already in use')
                .executeOne();
        } else body.name = room.name;
        
        /**
         * Ensure the user is an admin in the room
         * before updating the room.
         */
        if (!await RoomPermissionService.isUserInRoom({ room_uuid: pk, user, room_role_name: 'Admin' }))
            throw new ControllerError(403, 'Forbidden');

        /**
         * If a file is present, upload it and set the avatar_src
         * field to the file path.
         * If a file is not present, set the avatar_src to the
         * current avatar_src value.
         */
        if (file) body.avatar_src = await storageService.uploadFile(file, pk);
        else body.avatar_src = room.avatar_src;

        /**
         * If a field is not present in the body, set it to the
         * current value of the field in the room.
         */
        if (!body.description) body.description = room.description;
        if (!body.room_category_name) body.room_category_name = room.room_category_name;

        /**
         * Update the room.
         */
        await model
            .update({ body })
            .where(model.pk, pk)
            .transaction(transaction)
            .execute();
    }

    /**
     * @function destroy
     * @description Destroy a room.
     * @param {Object} options
     * @param {String} options.pk
     * @param {Object} options.user
     * @param {Object} transaction
     * @returns {Promise}
     */
    async destroy(options = { pk: null, user: null }, transaction) {
        const { pk, user } = options;

        /**
         * Ensure the necessary fields are present
         * and that the room exists.
         */
        const room = await model
            .throwIfNotPresent(pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where(model.pk, pk)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();
        
        /**
         * Ensure the user is an admin in the room
         * before destroying the room.
         */
        if (!await RoomPermissionService.isUserInRoom({ 
            room_uuid: room.uuid,
            user, 
            room_role_name: 'Admin' 
        })) throw new ControllerError(403, 'Forbidden');

        /**
         * Destroy the room.
         * And all room invite links for the room.
         * And all user rooms for the room.
         */
        await model.defineTransaction(async (t) => {
            await RoomSettingService.destroyAll({ room_uuid: pk }, t);
            await RoomInviteLinkService.destroyAll({ room_uuid: pk }, t);
            await UserRoomService.destroyAll({ room_uuid: pk }, t);
            await ChannelService.destroyAll({ room_uuid: pk }, t);
            await model
                .destroy()
                .where(model.pk, pk)
                .transaction(t)
                .execute();
        }, transaction);
    }
}

const service = new RoomService();

export default service;
