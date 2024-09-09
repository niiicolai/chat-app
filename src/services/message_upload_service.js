import ControllerError from '../errors/controller_error.js';
import StorageService from './storage_service.js';
import model from '../models/message_upload.js';
import dto from '../dtos/message_upload.js';
import ChannelMessageService from './channel_message_service.js';
import ChannelService from './channel_service.js';
import RoomPermissionService from './room_permission_service.js';
import UserService from './user_service.js';

/**
 * @constant storageService
 * @description Storage service to upload message uploads.
 */
const storageService = new StorageService('message_uploads');

/**
 * @constant types
 * @description The types of uploads.
 */
const types = {
    Image: 'Image',
    Video: 'Video',
    Document: 'Document'
}

/**
 * @function getUploadType
 * @description Get the upload type from the mimetype.
 * @param {String} mimetype The mimetype of the upload
 * @returns {String} The upload type
 */
const getUploadType = (mimetype) => {
    if (['image/jpeg', 'image/png', 'image/gif'].includes(mimetype)) return types.Image;
    if (['video/mp4', 'video/quicktime'].includes(mimetype)) return types.Video;
    return types.Document;
}

/**
 * @class MessageUploadService
 * @description crud service for message uploads.
 * @exports RoomInviteLinkService
 */
class MessageUploadService  {

    /**
     * @constructor
     */
    constructor() {
        this.model = model;
        this.dto = dto;
    }

    /**
     * @function sum 
     * @description Sum the field for the channel.
     * @param {Object} options
     * @param {String} options.channel_uuid
     * @param {String} options.field
     * @returns {Promise<Number>}
     */
    async sum(options = { channel_uuid: null, field: null }) {
        const { channel_uuid, field } = options;

        return await model
            .throwIfNotPresent(channel_uuid, 'channel_uuid is required')
            .throwIfNotPresent(field, 'field is required')
            .sum({ field })
            .include(ChannelMessageService.model, 'uuid', 'channel_message_uuid')
            .where('channel_uuid', channel_uuid)
            .execute();
    }

    /**
     * @function sumByRoomUuid
     * @description Sum the field for the channel.
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {String} options.field
     * @param {Object} options.user
     * @param {Boolean} skipPermissionCheck
     * @returns {Promise<Number>}
     */
    async sumByRoomUuid(options = { room_uuid: null, field: null, user: null }, skipPermissionCheck = false) {
        const { room_uuid, field, user } = options;

        /**
         * Ensure the user is an admin in the room.
         */
        if (!skipPermissionCheck && !await RoomPermissionService.isUserInRoom({
            room_uuid,
            user,
            room_role_name: 'Admin'
        })) throw new ControllerError(403, 'Forbidden');

        /**
         * Sum the field for the room.
         */
        return await model
            .throwIfNotPresent(room_uuid, 'room_uuid is required')
            .throwIfNotPresent(field, 'field is required')
            .sum({ field })
            .include(ChannelMessageService.model, 'uuid', 'channel_message_uuid')
            .include(ChannelService.model, 'uuid', 'channel_uuid', ChannelMessageService.model.mysql_table)
            .where('room_uuid', options.room_uuid)
            .execute();
    }

    /**
     * @function findAll
     * @description Find all message uploads for the room.
     * @param {Object} options
     * @param {String} options.page
     * @param {String} options.limit
     * @param {String} options.room_uuid
     * @param {String} options.user
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
         * Only members of the room can view the message uploads.
         */
        if (!await RoomPermissionService.isUserInRoom({ room_uuid, user, room_role_name: null }))
            throw new ControllerError(403, 'Forbidden');

        /**
         * Find all message uploads for the room.
         */
        return await model
            .find({ page, limit })
            .where('room_uuid', room_uuid)
            .include(ChannelMessageService.model, 'uuid', 'channel_message_uuid')
            .include(ChannelService.model, 'uuid', 'channel_uuid', ChannelMessageService.model.mysql_table)
            .include(UserService.model, 'uuid', 'user_uuid', ChannelMessageService.model.mysql_table)
            .dto(dto)
            .meta()
            .execute();
    }

    /**
     * @function create
     * @description Create a new message upload.
     * @param {Object} options
     * @param {Object} options.body
     * @param {Object} options.file
     * @param {Object} transaction
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, file: null }, transaction) {
        const { body, file } = options;

        /**
         * Ensure that the body and file are present.
         */
        await model
            .throwIfNotPresent(body, 'body is required')
            .throwIfNotPresent(body.uuid, 'UUID is required')
            .throwIfNotPresent(body.channel_message_uuid, 'Message Channel UUID is required')
            .throwIfNotPresent(file, 'File is required');
        
        /**
         * Upload the file to the storage service.
         * Set the src and size on the body.
         * Set the upload type name based on the mimetype.
         */
        body.src = await storageService.uploadFile(file, body.uuid);
        body.size = file.size;
        body.upload_type_name = getUploadType(file.mimetype);

        /**
         * Create the message upload.
         */
        await model
            .create({ body })
            .transaction(transaction)
            .execute();
        
        /**
         * Return the message upload.
         */
        return await model
            .find()
            .where('uuid', body.uuid)
            .dto(dto)
            .executeOne();
    }

    /**
     * @function destroy
     * @description Destroy a message upload.
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
         * and that the message upload exists.
         */
        await model
            .throwIfNotPresent(pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where('uuid', pk)
            .throwIfNotFound()
            .executeOne();

        /**
         * Ensure the user is an admin in the room
         * before destroying the message upload.
         */
        await model
            .destroy()
            .where('uuid', pk)
            .transaction(transaction)
            .execute();
    }
    

    /**
     * @function destroyAllByChannelMessageUuid
     * @description Destroy all message uploads related to a channel message.
     * @param {Object} options
     * @param {String} options.channel_message_uuid
     * @param {Object} transaction
     * @returns {Promise}
     */
    async destroyAllByChannelMessageUuid(options = { channel_message_uuid: null }, transaction) {
        /**
         * Destroy all message uploads related to the channel message.
         */
        await model
            .destroy()
            .where('channel_message_uuid', options.channel_message_uuid)
            .transaction(transaction)
            .execute();
    }

    /**
     * @function destroyAllByChannelUuid
     * @description Destroy all message uploads related to a channel.
     * @param {Object} options
     * @param {String} options.channel_uuid
     * @param {Object} transaction
     * @returns {Promise}
     */
    async destroyAllByChannelUuid(options = { channel_uuid: null }, transaction) {

        /**
         * Destroy all message uploads related to the channel.
         */
        await model
            .destroy()
            .where('channel_uuid', options.channel_uuid)
            .include(ChannelMessageService.model, 'uuid', 'channel_message_uuid')
            .transaction(transaction)
            .execute();
    }

    /**
     * @function destroyAllByRoomUuid
     * @description Destroy all message uploads
     * @param {Object} options
     * @param {String} options.channel_uuid
     * @param {Object} transaction
     * @returns {Promise}
     */
    async destroyAllByRoomUuid(options = { room_uuid: null }, transaction) {

        /**
         * Destroy all message uploads related to the channel.
         */
        await model
            .destroy()
            .include(ChannelMessageService.model, 'uuid', 'channel_message_uuid')
            .include(ChannelService.model, 'uuid', 'channel_uuid', ChannelMessageService.model.mysql_table)
            .where('room_uuid', options.room_uuid)
            .transaction(transaction)
            .execute();
    }
}

const service = new MessageUploadService();

export default service;
