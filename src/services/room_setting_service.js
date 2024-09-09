import RoomPermissionService from './room_permission_service.js';
import MessageUploadService from './message_upload_service.js';
import ControllerError from '../errors/controller_error.js';
import model from '../models/room_setting.js';
import dto from '../dtos/room_setting.js';

/**
 * @class RoomSettingService
 * @description CRUD service for room settings.
 * @exports RoomSettingService
 * @requires ControllerError
 * @requires model
 * @requires dto
 * @requires RoomPermissionService
 */
class RoomSettingService {

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
     * @function canUpload
     * @description Check if a user can upload a file to a room
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Number} options.byteSize
     * @param {Object} options.user
     * @returns {Promise<Boolean>}
     */
    async canUpload(options = { room_uuid: null, byteSize: null, user: null }) {
        const { room_uuid, byteSize, user } = options;

        /**
         * Ensure the necessary fields are present
         * and find the room setting.
         */
        const roomSetting = await model
            .throwIfNotPresent(room_uuid, 'room_uuid is required')
            .throwIfNotPresent(byteSize, 'byteSize is required')
            .throwIfNotPresent(user, 'user is required')
            .find()
            .where('room_uuid', room_uuid)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();

        /**
         * Convert the byte size to MB
         * and convert the upload size to MB
         */
        const convertBytesToMb = (bytes) => bytes / 1000000;
        const uploadSizeMb = convertBytesToMb(roomSetting.upload_bytes);
        const sizeMb = convertBytesToMb(byteSize);

        /**
         * Check if the uploaded file size is too large
         */
        if (byteSize > roomSetting.upload_bytes)
            throw new ControllerError(400, `File size is too large. Maximum size is ${uploadSizeMb} MB. The file size is ${sizeMb} MB`);

        /**
         * Check if the room has used too much of the total upload limit
         */
        const skipPermissionCheck = true;
        const sum = await MessageUploadService.sumByRoomUuid({ room_uuid, field: 'size' }, skipPermissionCheck); 
        const totalUploadSizeMb = convertBytesToMb(roomSetting.total_upload_bytes);   
        const newTotalUploadSizeMb = convertBytesToMb(sum + byteSize);
        if ((sum + byteSize) > roomSetting.total_upload_bytes)
        throw new ControllerError(400, `The room has used ${sum / 1000000} MB of the total upload limit of ${totalUploadSizeMb} MB. The file size is ${sizeMb} MB and the new total would be ${newTotalUploadSizeMb} MB`);


        /**
         * Return true if the user can upload
         */
        return true;
    }

    /**
     * @function findOne
     * @description Find a room setting by room_uuid.
     * @param {Object} options
     * @param {String} options.room_uuid
     * @returns {Promise<Object>}
     */
    async findOne(options = { room_uuid: null }) {
        const { room_uuid } = options;

        return await model
            .throwIfNotPresent(room_uuid, 'room_uuid is required')
            .find()
            .where('room_uuid', room_uuid)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();
    }

    /**
     * @function create
     * @description Create a room setting.
     * @param {Object} options
     * @param {Object} options.body
     * @param {Object} options.user
     * @param {Object} transaction
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, user: null }, transaction) {
        const { body, user } = options;

        /**
         * Set the default values for the room setting
         */
        body.total_upload_bytes = process.env.ROOM_TOTAL_UPLOAD_SIZE;
        body.upload_bytes = process.env.ROOM_UPLOAD_SIZE;
        body.join_message = process.env.ROOM_JOIN_MESSAGE;
        body.rules_text = process.env.ROOM_RULES_TEXT;
        body.max_channels = process.env.ROOM_MAX_CHANNELS;
        body.max_members = process.env.ROOM_MAX_MEMBERS;

        /**
         * Ensure the necessary fields are present
         * and that the room setting does not already exist.
         */
        await model
            .throwIfNotPresent(body, 'Resource body is required')
            .throwIfNotPresent(body.total_upload_bytes, 'total_upload_bytes is required')
            .throwIfNotPresent(body.join_message, 'join_message is required')
            .throwIfNotPresent(body.rules_text, 'rules_text is required')
            .throwIfNotPresent(body.max_channels, 'max_channels is required')
            .throwIfNotPresent(body.max_members, 'max_members is required')
            .throwIfNotPresent(body.room_uuid, 'room_uuid is required')
            .throwIfNotPresent(body.uuid, 'uuid is required')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where(model.pk, body.uuid)
            .where('room_uuid', body.room_uuid)
            .throwIfFound()
            .executeOne();

        /**
         * Create the room setting
         */
        await this.model
            .create({ body })
            .transaction(transaction)
            .execute();

        /**
         * No need to return the created user room,
         * because it is not needed in the controller.
         */
    }

    /**
     * @function update
     * @description Update a room setting.
     * @param {Object} options
     * @param {Object} options.pk
     * @param {Object} options.body
     * @param {Object} options.user
     * @param {Object} transaction
     * @returns {Promise<Object>}
     */
    async update(options = { pk: null, body: null, user: null }, transaction) {
        const { pk, body, user } = options;

        /**
         * Ensure the necessary fields are present
         * and that the room setting exists.
         * Also ensure that fields that
         * cannot be updated are not present.
         */
        const roomSetting = await model
            .throwIfNotPresent(pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(body, 'Resource body is required')
            .throwIfNotPresent(user, 'User is required')
            .throwIfPresent(body.total_upload_bytes, 'total_upload_bytes cannot be updated')
            .throwIfPresent(body.upload_bytes, 'upload_bytes cannot be updated')
            .throwIfPresent(body.max_channels, 'max_channels cannot be updated')
            .throwIfPresent(body.max_members, 'max_members cannot be updated')
            .throwIfPresent(body.room_uuid, 'room_uuid cannot be updated')
            .find()
            .where(model.pk, pk)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();

        /**
         * Ensure the user is an admin in the room
         * before updating the room setting.
         */
        if (!await RoomPermissionService.isUserInRoom({
            room_uuid: roomSetting.room_uuid,
            user,
            room_role_name: 'Admin'
        })) throw new ControllerError(403, 'Forbidden');

        /**
         * Overwrite default values with the existing values
         */
        body.total_upload_bytes = roomSetting.total_upload_bytes;
        body.upload_bytes = roomSetting.upload_bytes;
        body.max_channels = roomSetting.max_channels;
        body.max_members = roomSetting.max_members;
        body.room_uuid = roomSetting.room_uuid;

        if (!body.join_message) body.join_message = roomSetting.join_message;
        if (!body.rules_text) body.rules_text = roomSetting.rules_text;
        if (!body.join_channel_uuid) body.join_channel_uuid = roomSetting.join_channel_uuid;

        /**
         * Update the room setting
         */
        await model
            .update({ body })
            .where(model.pk, pk)
            .transaction(transaction)
            .execute();
    }

    /**
     * @function clearJoinChannel
     * @description Clear the join channel from a room setting.
     * @param {Object} options
     * @param {String} options.join_channel_uuid
     * @param {Object} transaction
     * @returns {Promise<void>}
     */
    async clearJoinChannel(options = { join_channel_uuid: null }, transaction) {
        const { join_channel_uuid } = options;

        /**
         * Ensure the necessary fields are present
         * and that the room setting exists.
         */
        const roomSetting = await model
            .throwIfNotPresent(join_channel_uuid, 'join_channel_uuid is required')
            .find()
            .where('join_channel_uuid', join_channel_uuid)
            .dto(dto)
            .executeOne();

        /**
         * If no room setting is found, 
         * we just return because it means
         * no room setting is associated 
         * with the join channel.
         */
        if (!roomSetting) {
            return;
        }

        /**
         * Clear the join channel
         * and ensure the other room settings are not updated.
         */
        await model
            .update({ body: {
                join_channel_uuid: null,
                total_upload_bytes: roomSetting.total_upload_bytes,
                upload_bytes: roomSetting.upload_bytes,
                max_channels: roomSetting.max_channels,
                max_members: roomSetting.max_members,
                room_uuid: roomSetting.room_uuid,
                join_message: roomSetting.join_message,
                rules_text: roomSetting.rules_text
            }})
            .where('join_channel_uuid', join_channel_uuid)
            .transaction(transaction)
            .execute();
    }

    /**
     * @function destroy
     * @description Destroy a room setting.
     * @param {Object} options
     * @param {String} options.pk
     * @param {Object} options.user
     * @param {Object} transaction
     * @returns {Promise<void>}
     */
    async destroy(options = { pk: null, user: null }, transaction) {
            const { pk, user } = options;

            /**
             * Ensure the necessary fields are present
             * and that the room setting exists.
             */
            const roomSetting = await model
                .throwIfNotPresent(pk, 'Primary key value is required (pk)')
                .throwIfNotPresent(user, 'User is required')
                .find()
                .where(model.pk, pk)
                .throwIfNotFound()
                .dto(dto)
                .executeOne();

            /**
             * Ensure the user is an admin in the room
             * before destroying the room setting.
             */
            if (!await RoomPermissionService.isUserInRoom({
                room_uuid: roomSetting.room_uuid,
                user,
                room_role_name: 'Admin'
            })) throw new ControllerError(403, 'Forbidden');

            /**
             * Destroy the room setting
             */
            await model
                .destroy()
                .where(model.pk, pk)
                .transaction(transaction)
                .execute();
        }

    /**
     * @function destroyAll
     * @description Destroy all room settings for a room.
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

    const service = new RoomSettingService();

export default service;
