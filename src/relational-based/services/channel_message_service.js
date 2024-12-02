import Validator from '../../shared/validators/channel_message_service_validator.js';
import BroadcastChannelService from '../../shared/services/broadcast_channel_service.js';
import { getUploadType } from '../../shared/utils/file_utils.js';
import err from '../../shared/errors/index.js';
import RFS from './room_file_service.js';
import RPS from './room_permission_service.js';
import dto from '../dto/channel_message_dto.js';
import db from '../sequelize/models/index.cjs';

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

        await db.sequelize.transaction(async (transaction) => {
            const [channel, isInRoom] = await Promise.all([
                db.ChannelView.findByPk(channel_uuid, { transaction }),
                RPS.isInRoomByChannel({ channel_uuid, user }, transaction),
            ]);
            
            if (!channel) throw new err.EntityNotFoundError('channel');
            if (!isInRoom) throw new err.RoomMemberRequiredError();

            const room_uuid = channel.room_uuid;
            const room_file_body = { room_uuid, room_file_type_name: 'ChannelMessageUpload' };
            const room_file_uuid = (file && file.size > 0)
                ? (await RFS.create({ file, user, body: room_file_body }, transaction)).uuid
                : null;

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

        await db.sequelize.transaction(async (transaction) => {
            const channelMessage = await db.ChannelMessageView.findByPk(uuid, { transaction });
            if (!channelMessage) throw new err.EntityNotFoundError('channel_message');

            await ChannelMessageService.handleWritePermission(channelMessage, user, transaction);
            await channelMessage.deleteChannelMessageProc(transaction);

            if (channelMessage.upload_src) {
                await RFS.remove(channelMessage.room_file_uuid, channelMessage.upload_src, transaction);
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
            throw new err.OwnershipOrLeastModRequiredError('channel_message');
        }
    }
}

const service = new ChannelMessageService();

export default service;
