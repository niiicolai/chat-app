import ChannelMessageServiceValidator from '../../shared/validators/channel_message_service_validator.js';
import BroadcastChannelService from '../../shared/services/broadcast_channel_service.js';
import EntityNotFoundError from '../../shared/errors/entity_not_found_error.js';
import RoomMemberRequiredError from '../../shared/errors/room_member_required_error.js';
import ExceedsRoomTotalFilesLimitError from '../../shared/errors/exceeds_room_total_files_limit_error.js';
import ExceedsSingleFileSizeError from '../../shared/errors/exceeds_single_file_size_error.js';
import DuplicateEntryError from '../../shared/errors/duplicate_entry_error.js';
import OwnershipOrLeastModRequiredError from '../../shared/errors/ownership_or_least_mod_required_error.js';
import StorageService from '../../shared/services/storage_service.js';
import { getUploadType } from '../../shared/utils/file_utils.js';
import RPS from './room_permission_service.js';
import dto from '../dto/channel_message_dto.js';
import db from '../sequelize/models/index.cjs';

/**
 * @constant storage
 * @description Storage service instance for channel message uploads.
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
        ChannelMessageServiceValidator.findOne(options);

        const entity = await db.ChannelMessageView.findByPk(options.uuid);
        if (!entity) throw new EntityNotFoundError('channel_message');

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid: entity.channel_uuid, user: options.user, role_name: null });
        if (!isInRoom) throw new RoomMemberRequiredError();

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
        options = ChannelMessageServiceValidator.findAll(options);

        const { channel_uuid, user, page, limit, offset } = options;

        const channel = await db.ChannelView.findOne({ uuid: channel_uuid });
        if (!channel) throw new EntityNotFoundError('channel');

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid, user, role_name: null });
        if (!isInRoom) throw new RoomMemberRequiredError();

        const [total, data] = await Promise.all([
            db.ChannelMessageView.count({ channel_uuid }),
            db.ChannelMessageView.findAll({
                where: { channel_uuid },
                ...(limit && { limit }),
                ...(offset && { offset })
            })
        ]);

        return {
            data: data.map(entity => dto(entity)),
            total,
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
        ChannelMessageServiceValidator.create(options);

        const { body, file, user } = options;
        const { uuid, body: msg, channel_uuid } = body;

        await db.sequelize.transaction(async (transaction) => {
            const channel = await db.ChannelView.findOne({ where: { channel_uuid }, transaction });
            if (!channel) throw new EntityNotFoundError('channel');

            const isUuidInUse = await db.ChannelMessageView.findOne({ where: { channel_message_uuid: uuid }, transaction });
            if (isUuidInUse) throw new DuplicateEntryError('channel_message', 'uuid', uuid);

            const isInRoom = await RPS.isInRoomByChannel({ channel_uuid, user, role_name: null }, transaction);
            if (!isInRoom) throw new RoomMemberRequiredError();

            const replacements = {
                uuid,
                msg,
                channel_message_type_name: "User",
                channel_uuid,
                user_uuid: user.sub,
                room_uuid: channel.room_uuid,
                upload_type: null,
                upload_src: null,
                bytes: null,
            };

            if (file && file.size > 0) {
                const [exceedsTotalFilesLimit, exceedsSingleFileSize] = await Promise.all([
                    RPS.fileExceedsTotalFilesLimit({ room_uuid: channel.room_uuid, bytes: file.size }, transaction),
                    RPS.fileExceedsSingleFileSize({ room_uuid: channel.room_uuid, bytes: file.size }, transaction),
                ]);

                if (exceedsTotalFilesLimit) throw new ExceedsRoomTotalFilesLimitError();
                if (exceedsSingleFileSize) throw new ExceedsSingleFileSizeError();

                replacements.upload_type = getUploadType(file);
                replacements.upload_src = await storage.uploadFile(file, uuid);
                replacements.bytes = file.size;
            }

            await db.sequelize.query('CALL create_channel_message_proc(:uuid, :msg, :channel_message_type_name, :channel_uuid, :user_uuid, :upload_type, :upload_src, :bytes, :room_uuid, @result)', {
                replacements,
                transaction,
            });
        });

        return await db.ChannelMessageView.findByPk(uuid)
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
        ChannelMessageServiceValidator.update(options);

        const { uuid, body, user } = options;
        const { body: msg } = body;

        await db.sequelize.transaction(async (transaction) => {
            const channelMessage = await db.ChannelMessageView.findByPk(uuid, { transaction });
            if (!channelMessage) throw new EntityNotFoundError('channel_message');

            await ChannelMessageService.handleWritePermission(channelMessage, user, transaction);

            if (msg) {
                await db.sequelize.query('CALL edit_channel_message_proc(:uuid, :msg, @result)', {
                    replacements: { uuid, msg },
                    transaction,
                });
            }
        });

        return await db.ChannelMessageView.findByPk(uuid)
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
        ChannelMessageServiceValidator.destroy(options);

        const { uuid, user } = options;

        await db.sequelize.transaction(async (transaction) => {
            const channelMessage = await db.ChannelMessageView.findByPk(uuid, { transaction });
            if (!channelMessage) throw new EntityNotFoundError('channel_message');

            await ChannelMessageService.handleWritePermission(channelMessage, user, transaction);

            await db.sequelize.query('CALL delete_channel_message_proc(:uuid, @result)', {
                replacements: { uuid },
                transaction,
            });

            if (channelMessage.upload_src) {
                const key = storage.parseKey(channelMessage.upload_src);
                await storage.deleteFile(key);
            }

            BroadcastChannelService.destroy(channelMessage.channel_uuid, uuid);
        });
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
            throw new OwnershipOrLeastModRequiredError('channel_message');
        }
    }
}

const service = new ChannelMessageService();

export default service;
