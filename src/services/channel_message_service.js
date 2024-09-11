
import model from '../models/channel_message.js';
import dto from '../dtos/channel_message.js';
import RoomSettingService from './room_setting_service.js';
import ControllerError from '../errors/controller_error.js';
import ChannelService from './channel_service.js';
import UserService from './user_service.js';
import RoomPermissionService from './room_permission_service.js';
import MessageUploadService from './message_upload_service.js';
import { broadcastChannel } from './websocket_service.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @class ChannelMessageService
 * @description CRUD service for channel messages.
 * @exports ChannelMessageService
 */
class ChannelMessageService {

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
     * @description Find a channel message by primary key and user.
     * @param {Object} options
     * @param {String} options.pk
     * @param {Object} options.user
     * @returns {Promise<Object>}
     */
    async findOne(options = { pk: null, user: null }) {   
        const { pk, user } = options;

        /**
         * Ensure the necessary fields are present
         * and find the channel message.
         * Include the user who created the message.
         */     
        const channelMessage = await model
            .throwIfNotPresent(pk, 'uuid is required')
            .throwIfNotPresent(user, 'user is required')
            .find()
            .where(`${model.mysql_table}.${model.pk}`, pk)
            .include(UserService.model, 'uuid', 'user_uuid')
            .dto(dto)
            .throwIfNotFound()
            .executeOne();

        /**
         * Ensure the user and channel are in the room
         * where the channel message is being retrieved.
         */
        if (!await RoomPermissionService.isUserAndChannelInRoom({ 
            channel_uuid: channelMessage.channel_uuid,
            user,
            room_role_name: null 
        })) throw new ControllerError(403, 'Forbidden');

        /**
         * Return the channel message.
         */
        return channelMessage;
    }

    /**
     * @function findAll
     * @description Find all channel messages by channel_uuid and user.
     * @param {Object} options
     * @param {Number} options.page
     * @param {Number} options.limit
     * @param {String} options.channel_uuid
     * @param {Object} options.user
     * @returns {Promise<Array>}
     */
    async findAll(options = { page: null, limit: null, channel_uuid: null, user: null }) {
        const { page, limit, channel_uuid, user } = options;

        /**
         * Ensure the necessary fields are present
         */    
        await model
            .throwIfNotPresent(channel_uuid, 'channel_uuid is required')
            .throwIfNotPresent(user, 'user is required')

        /**
         * Ensure the user and channel are in the room
         * where the channel messages are being retrieved.
         */
        if (!await RoomPermissionService.isUserAndChannelInRoom({ 
            channel_uuid: channel_uuid,
            user,
            room_role_name: null 
        })) throw new ControllerError(403, 'Forbidden');

        /**
         * Retrieve the channel messages
         * and include the user who created
         * the message and any uploads.
         */
        return await model
            .find({ page, limit })
            .where('channel_uuid', channel_uuid)
            .include(UserService.model, 'uuid', 'user_uuid')
            .include(MessageUploadService.model, 'channel_message_uuid')
            .orderBy(`${model.mysql_table}.created_at DESC`)
            .dto(dto)
            .meta()
            .execute();
    }

    /**
     * @function create
     * @description Create a channel message.
     * @param {Object} options
     * @param {Object} options.body
     * @param {Object} options.user
     * @param {Object} options.file
     * @param {Object} transaction
     * @param {Number} created_by_system
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, user: null, file: null }, transaction, created_by_system = 0, skipPermissionCheck = false) {
        const { body, user, file } = options;

        if (!skipPermissionCheck) {
            await model.throwIfNotPresent(user, 'user is required')
        }

        /**
         * Ensure the necessary fields are present
         * and that a channel message with the same
         * primary key does not already exist.
         */
        await model
            .throwIfNotPresent(body, 'Resource body is required')
            .throwIfNotPresent(body.body, 'body is required') // Note: The model has a body field. Therefore, body.body.
            .throwIfNotPresent(body.channel_uuid, 'channel_uuid is required')
            .throwIfNotPresent(body.uuid, 'uuid is required')
            .find()
            .where(`${model.mysql_table}.${model.pk}`, body.uuid)
            .throwIfFound('A channel message with the same primary key already exists')
            .executeOne();

        /**
         * Ensure the user and channel are in the room
         * where the channel exists and the messages
         * are being created.
         */
        if (!skipPermissionCheck && !await RoomPermissionService.isUserAndChannelInRoom({ 
            channel_uuid: body.channel_uuid, 
            user, 
            room_role_name: null 
        })) throw new ControllerError(403, 'Forbidden');

        /**
         * Set the created_by_system field to ensure
         * the user cannot make system messages.
         */
        body.created_by_system = created_by_system;

        /**
         * Get the channel to find the room the message belongs to.
         */
        const channel = await ChannelService.findOne({ pk: body.channel_uuid, user }, skipPermissionCheck);

        /**
         * Create the channel message
         * and the message upload if
         * a file is provided.
         */
        await model.defineTransaction(async (t) => {
            await model
                .create({ body: {...body, user_uuid: user?.sub} })
                .transaction(t)
                .execute();

            /** 
             * If a file is provided
             * and the room settings allow
             * the user to upload, create the
             * message upload.
             */
            if (file && await RoomSettingService.canUpload({
                room_uuid: channel.room_uuid,
                byteSize: file.size,
                user
            })) {
                await MessageUploadService.create({ 
                    body: { uuid: uuidv4(), channel_message_uuid: body.uuid },
                    file,
                }, t);
            }
        }, transaction);

    
        /**
         * Get the channel message to be returned.
         */
        const result = await model
            .find()
            .where(`${model.mysql_table}.${model.pk}`, body.uuid)
            .include(UserService.model, 'uuid', 'user_uuid')
            .dto(dto)
            .executeOne();

        /**
         * Broadcast the channel message to all users
         * in the room where the channel message was created.
         */
        broadcastChannel(`channel-${channel.uuid}`, result);

        /**
         * Return the channel message.
         */
        return result;
    }


    /**
     * @function update
     * @description Update a channel message.
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
         * Get the channel message to be updated
         * and ensure the necessary fields are present.
         */
        const channelMessage = await model
            .throwIfNotPresent(pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(body, 'Resource body is required')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where(model.pk, pk)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();

        /**
         * The user must be the owner of the
         * channel message or an admin of the room.
         */
        const isOwner = user.sub === channelMessage.user_uuid;
        const hasSpecialRole = await RoomPermissionService.isUserAndChannelInRoom({ 
            channel_uuid: channelMessage.channel_uuid, user, room_role_names: ['Admin', 'Moderator']
        });
        if (!isOwner && !hasSpecialRole) throw new ControllerError(403, 'Forbidden');

        /**
         * Add the user_uuid and channel_uuid to the body
         * no matter what the user sends in the body.
         */
        body.user_uuid = channelMessage.user_uuid;
        body.channel_uuid = channelMessage.channel_uuid;
        body.created_by_system = channelMessage.created_by_system;

        /**
         * Update the channel message.
         */
        await model
            .update({ body })
            .where(model.pk, pk)
            .transaction(transaction)
            .execute();
    }

    /**
     * @function destroy
     * @description Destroy a channel message.
     * @param {Object} options
     * @param {String} options.pk
     * @param {Object} options.user
     * @param {Object} transaction
     * @returns {Promise}
     */
    async destroy(options = { pk: null, user: null }, transaction) {
        const { pk, user } = options;

        /**
         * Get the channel message to be destroyed.
         */
        const channelMessage = await model
            .throwIfNotPresent(pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where(model.pk, pk)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();

        /**
         * The user must be the owner of the 
         * channel message or an admin of the room.
         */
        const isOwner = user.sub === channelMessage.user_uuid;
        const hasSpecialRole = await RoomPermissionService.isUserAndChannelInRoom({ 
            channel_uuid: channelMessage.channel_uuid, user, room_role_names: ['Admin', 'Moderator']
        });
        if (!isOwner && !hasSpecialRole) throw new ControllerError(403, 'Forbidden');

        
        /**
         * Destroy the channel message.
         */
        await model.defineTransaction(async (t) => {
            /*
                # Added as a trigger in the database
                await MessageUploadService.destroyAllByChannelMessageUuid({ channel_message_uuid: pk }, t);
            */
            await model
                .destroy()
                .where(model.pk, pk)
                .transaction(t)
                .execute();
        });
    }

    /**
     * @function destroyAllByChannelUuid
     * @description Destroy all channel messages related to the channel.
     * @param {Object} options
     * @param {String} options.channel_uuid
     * @param {Object} transaction
     * @returns {Promise}
     */
    async destroyAllByChannelUuid(options = { channel_uuid: null }, transaction) {
        const { channel_uuid } = options;

        await model.defineTransaction(async (t) => {
            /*
                # Added as a trigger in the database
                await MessageUploadService.destroyAllByChannelMessageUuid({ channel_message_uuid: pk }, t);
            */

            /**
             * Destroy all channel messages related to the channel.
             */
            await model
                .destroy()
                .where('channel_uuid', channel_uuid)
                .transaction(t)
                .execute();
        }, transaction);
    }

    /**
     * @function destroyAllByRoomUuid
     * @description Destroy all channel messages related to the room.
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Object} transaction
     * @returns {Promise}
     */
    async destroyAllByRoomUuid(options = { room_uuid: null }, transaction) {
        const { room_uuid } = options;

        await model.defineTransaction(async (t) => {
            /**
             * Destroy all message uploads related to the channel.
             */
            await MessageUploadService.destroyAllByRoomUuid({ room_uuid }, t);

            /**
             * Destroy all channel messages related to the channel.
             */
            await model
                .destroy()
                .include(ChannelService.model, 'uuid', 'channel_uuid')
                .where('room_uuid', room_uuid)
                .transaction(t)
                .execute();
        }, transaction);
    }
}

const service = new ChannelMessageService();

export default service;
