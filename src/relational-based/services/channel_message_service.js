import Validator from '../../shared/validators/channel_message_service_validator.js';
import StorageService from '../../shared/services/storage_service.js';
import BroadcastChannelService from '../../shared/services/broadcast_channel_service.js';
import { getUploadType } from '../../shared/utils/file_utils.js';
import err from '../../shared/errors/index.js';
import RPS from './room_permission_service.js';
import dto from '../dto/channel_message_dto.js';
import db from '../sequelize/models/index.cjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * @constant storage
 * @description Storage service instance
 * @type {StorageService}
 */
const storage = new StorageService('channel_message_upload');

/**
 * @class ChannelMessageService
 * @description Service class for channel messages.
 * @exports ChannelMessageService
 */
class ChannelMessageService {

    /**
     * @function findOne
     * @description Find a channel message by UUID.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const { uuid, user } = options;
        const entity = await db.ChannelMessageView.findByPk(uuid);

        if (!entity) throw new err.EntityNotFoundError('channel_message');

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid: entity.channel_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto(entity);
    }

    /**
     * @function findAll
     * @description Find all channel messages by channel UUID.
     * @param {Object} options
     * @param {string} options.channel_uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { channel_uuid: null, user: null, page: null, limit: null }) {
        options = Validator.findAll(options);

        const { channel_uuid, user, page, limit, offset } = options;
        const [channel, isInRoom] = await Promise.all([
            db.ChannelView.findByPk(channel_uuid),
            RPS.isInRoomByChannel({ channel_uuid, user }),
        ]);

        if (!channel) throw new err.EntityNotFoundError('channel');
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const [total, data] = await Promise.all([
            db.ChannelMessageView.count({ channel_uuid }),
            db.ChannelMessageView.findAll({
                where: { channel_uuid },
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
     * @description Create a channel message.
     * @param {Object} options
     * @param {Object} options.body
     * @param {string} options.body.uuid
     * @param {string} options.body.body
     * @param {string} options.body.channel_uuid
     * @param {Object} options.file optional
     * @param {Object} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, file: null, user: null }) {
        Validator.create(options);

        const { body, file, user } = options;
        const { uuid, body: msg, channel_uuid } = body;

        const [channel, isInRoom] = await Promise.all([
            db.ChannelView.findByPk(channel_uuid),
            RPS.isInRoomByChannel({ channel_uuid, user }),
        ]);
        
        if (!channel) throw new err.EntityNotFoundError('channel');
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const room_uuid = channel.room_uuid;
        const room_file_src = await this.createUpload({ uuid, room_uuid, file });

        await db.sequelize.transaction(async (transaction) => {
            const room_file_uuid = (room_file_src ? uuidv4() : null);
            if (room_file_src) {
                await db.RoomFileView.createRoomFileProcStatic({
                    room_file_uuid,
                    room_file_src,
                    room_file_size: file.size,
                    room_uuid: room_uuid,
                    room_file_type_name: 'ChannelMessageUpload',
                }, transaction);
            }

            await db.ChannelMessageView.createChannelMessageProcStatic({
                uuid,
                msg,
                channel_uuid,
                user_uuid: user.sub,
                room_uuid: channel.room_uuid,
                channel_message_type_name: "User",
                ...(room_file_uuid && {
                    upload_type: getUploadType(file),
                    room_file_uuid,
                })
            }, transaction);
        }).catch((error) => {
            // Delete the avatar file if it was uploaded
            if (room_file_src) storage.deleteFile(storage.parseKey(room_file_src));

            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new err.DuplicateEntryError('channel_message', error.errors[0].path, error.errors[0].value);
            } else if (error.name === 'SequelizeForeignKeyConstraintError') {
                throw new err.EntityNotFoundError(error.fields[0]);
            }

            throw error;
        });

        return await db.ChannelMessageView
            .findByPk(uuid)
            .then((channelMessage) => dto(channelMessage))
            .then((channelMessage) => {
                BroadcastChannelService.create(channelMessage);
                return channelMessage;
            });
    }

    /**
     * @function update
     * @description Update a channel message.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.body
     * @param {string} options.body.body optional
     * @param {Object} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async update(options = { uuid: null, body: null, user: null }) {
        Validator.update(options);

        const { uuid, body, user } = options;
        const { body: msg } = body;

        await db.sequelize.transaction(async (transaction) => {
            const channelMessage = await db.ChannelMessageView.findByPk(uuid, { transaction });
            if (!channelMessage) throw new err.EntityNotFoundError('channel_message');

            await ChannelMessageService.handleWritePermission(channelMessage, user, transaction);
            await channelMessage.editChannelMessageProc({ msg }, transaction);
        });

        return await db.ChannelMessageView
            .findByPk(uuid)
            .then((channelMessage) => dto(channelMessage))
            .then((channelMessage) => {
                BroadcastChannelService.update(channelMessage);
                return channelMessage;
            });
    }

    /**
     * @function destroy
     * @description Destroy a channel message.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.user
     * @param {string} options.user.sub
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null, user: null }) {
        Validator.destroy(options);

        const { uuid, user } = options;

        const channelMessage = await db.ChannelMessageView.findByPk(uuid);
        if (!channelMessage) throw new err.EntityNotFoundError('channel_message');

        await db.sequelize.transaction(async (transaction) => {
            await ChannelMessageService.handleWritePermission(channelMessage, user, transaction);
            await channelMessage.deleteChannelMessageProc(transaction);

            if (channelMessage.room_file_uuid) {
                await db.RoomFileView.deleteRoomFileProcStatic({ uuid: channelWebhook.room_file_uuid }, transaction);
                await storage.deleteFile(storage.parseKey(channelMessage.room_file_src));
            }
        });

        BroadcastChannelService.destroy(channelMessage.channel_uuid, uuid);
    }

    /**
     * @function handleWritePermission
     * @description Handle write permission for a channel message that already exists and is being modified.
     * The user must be the owner of the message, a moderator, or an admin.
     * @param {Object} channelMessage
     * @param {Object} user
     * @param {Object} transaction
     * @throws {OwnershipOrLeastModRequiredError}
     */
    static async handleWritePermission(channelMessage, user, transaction) {
        if (!channelMessage) throw new Error('Handle write permission requires a channel message.');
        if (!user) throw new Error('Handle write permission requires a user.');
        
        const isOwner = channelMessage.user_uuid === user.sub;
        const [isModerator, isAdmin] = await Promise.all([
            RPS.isInRoomByChannel({ channel_uuid: channelMessage.channel_uuid, user, role_name: 'Moderator' }, transaction),
            RPS.isInRoomByChannel({ channel_uuid: channelMessage.channel_uuid, user, role_name: 'Admin' }, transaction),
        ]);

        if (!isOwner && !isModerator && !isAdmin) {
            throw new err.OwnershipOrLeastModRequiredError('channel_message');
        }
    }

    /**
     * @function createUpload
     * @description Create a channel message upload file (helper function)
     * @param {Object} options
     * @param {String} options.uuid
     * @param {String} options.room_uuid
     * @param {Object} options.file
     * @returns {Promise<String | null>}
     */
    async createUpload(options = { uuid: null, room_uuid: null, file: null }) {
        if (!options) throw new Error('createUpload: options is required');
        if (!options.uuid) throw new Error('createUpload: options.uuid is required');
        if (!options.room_uuid) throw new Error('createUpload: options.room_uuid is required');

        const { uuid, room_uuid, file } = options;

        if (file && file.size > 0) {
            const [singleLimit, totalLimit] = await Promise.all([
                RPS.fileExceedsSingleFileSize({ room_uuid, bytes: file.size }),
                RPS.fileExceedsTotalFilesLimit({ room_uuid, bytes: file.size }),
            ]);

            if (totalLimit) throw new err.ExceedsRoomTotalFilesLimitError();
            if (singleLimit) throw new err.ExceedsSingleFileSizeError();

            return await storage.uploadFile(file, uuid);
        }

        return null;
    }
}

const service = new ChannelMessageService();

export default service;
