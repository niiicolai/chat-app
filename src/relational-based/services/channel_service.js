import Validator from '../../shared/validators/channel_service_validator.js';
import StorageService from '../../shared/services/storage_service.js';
import err from '../../shared/errors/index.js';
import RPS from './room_permission_service.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/channel_dto.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @constant storage
 * @description Storage service instance
 * @type {StorageService}
 */
const storage = new StorageService('channel_avatar');

/**
 * @class ChannelService
 * @description Service class for channels.
 * @exports ChannelService
 */
class ChannelService {

    /**
     * @function findOne
     * @description Find a channel by UUID.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const { uuid: channel_uuid, user } = options;
        const entity = await db.ChannelView.findByPk(channel_uuid);

        if (!entity) throw new err.EntityNotFoundError('channel');

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto(entity);
    }

    /**
     * @function findAll
     * @description Find all channels by room UUID.
     * @param {Object} options
     * @param {string} options.room_uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = Validator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        const room = await db.RoomView.findOne({ uuid: room_uuid });
        if (!room) throw new err.EntityNotFoundError('room');

        const isInRoom = await RPS.isInRoom({ room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const [total, data] = await Promise.all([
            db.ChannelView.count({ where: { room_uuid } }),
            db.ChannelView.findAll({
                where: { room_uuid },
                ...(limit && { limit }),
                ...(offset && { offset }),
                order: [['channel_created_at', 'DESC']]
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
     * @description Create a channel.
     * @param {Object} options
     * @param {Object} options.body
     * @param {Object} options.body.uuid
     * @param {Object} options.body.name
     * @param {Object} options.body.description
     * @param {Object} options.body.channel_type_name
     * @param {Object} options.body.room_uuid
     * @param {Object} options.file optional
     * @param {Object} options.user
     * @param {Object} options.user.sub
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, file: null, user: null }) {
        Validator.create(options);

        const { body, file, user } = options;
        const { room_uuid, uuid } = body;

        const room_file_src = await this.createAvatar({ uuid, room_uuid, file });

        await db.sequelize.transaction(async (transaction) => {
            const [inRoom, countExceedsLimit] = await Promise.all([
                RPS.isInRoom({ room_uuid, user, role_name: 'Admin' }, transaction),
                RPS.channelCountExceedsLimit({ room_uuid, add_count: 1 }, transaction)
            ]);

            if (!inRoom) throw new err.AdminPermissionRequiredError();
            if (countExceedsLimit) throw new err.ExceedsRoomChannelCountError();

            const room_file_uuid = (room_file_src ? uuidv4() : null);
            if (room_file_src) {
                await db.RoomFileView.createRoomFileProcStatic({
                    room_file_uuid,
                    room_file_src,
                    room_file_size: file.size,
                    room_uuid: room_uuid,
                    room_file_type_name: 'ChannelAvatar',
                }, transaction);
            }

            await db.ChannelView.createChannelProcStatic({ 
                ...body, 
                ...(room_file_uuid && { room_file_uuid }), 
            }, transaction);
            
        }).catch((error) => {
            // Delete the avatar file if it was uploaded
            if (room_file_src) storage.deleteFile(storage.parseKey(room_file_src));

            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new err.DuplicateEntryError('channel', error.errors[0].path, error.errors[0].value);
            } else if (error.name === 'SequelizeForeignKeyConstraintError') {
                throw new err.EntityNotFoundError(error.fields[0]);
            }

            throw error;
        });
        
        return await db.ChannelView.findByPk(body.uuid).then((channel) => dto(channel));
    }

    /**
     * @function update
     * @description Update a channel.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.body
     * @param {string} options.body.name optional
     * @param {string} options.body.description optional
     * @param {Object} options.file optional
     * @param {Object} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async update(options = { uuid: null, body: null, file: null, user: null }) {
        Validator.update(options);

        const { uuid, body, file, user } = options;
        const { name, description } = body;

        const [channel, isAdmin] = await Promise.all([
            db.ChannelView.findByPk(uuid),
            RPS.isInRoomByChannel({ channel_uuid: uuid, user, role_name: 'Admin' })
        ]);

        if (!channel) throw new err.EntityNotFoundError('channel');
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const room_uuid = channel.room_uuid;
        const room_file_src = await this.createAvatar({ uuid, room_uuid, file });

        await db.sequelize.transaction(async (transaction) => {
            const room_file_uuid = (room_file_src ? uuidv4() : null);
            if (room_file_src) {
                await db.RoomFileView.createRoomFileProcStatic({
                    room_file_uuid,
                    room_file_src,
                    room_file_size: file.size,
                    room_uuid: room_uuid,
                    room_file_type_name: 'ChannelAvatar',
                }, transaction);
            }

            await channel.editChannelProc({
                ...(name && { name }),
                ...(description && { description }),
                ...(room_file_uuid && { room_file_uuid }),
            }, transaction);

            if (room_file_src && channel.room_file_uuid) {
                await db.RoomFileView.deleteRoomFileProcStatic({ uuid: channel.room_file_uuid }, transaction);
                await storage.deleteFile(storage.parseKey(channel.room_file_src));
            }

        }).catch((error) => {
            // Delete the avatar file if it was uploaded
            if (room_file_src) storage.deleteFile(storage.parseKey(room_file_src));

            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new err.DuplicateEntryError('channel', error.errors[0].path, error.errors[0].value);
            } else if (error.name === 'SequelizeForeignKeyConstraintError') {
                throw new err.EntityNotFoundError(error.fields[0]);
            }

            throw error;
        });

        return await db.ChannelView
            .findByPk(uuid)
            .then((channel) => dto(channel));
    }

    /**
     * @function destroy
     * @description Destroy a channel.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.user
     * @param {string} options.user.sub
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null, user: null }) {
        Validator.destroy(options);

        const { uuid: channel_uuid, user } = options;

        await db.sequelize.transaction(async (transaction) => {
            const [channel, isAdmin] = await Promise.all([
                db.ChannelView.findByPk(channel_uuid, { transaction }),
                RPS.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }, transaction)
            ]);

            if (!channel) throw new err.EntityNotFoundError('channel');
            if (!isAdmin) throw new err.AdminPermissionRequiredError();

            await channel.deleteChannelProc(transaction);

            if (channel.room_file_uuid) {
                await db.RoomFileView.deleteRoomFileProcStatic({ uuid: channel.room_file_uuid }, transaction);
                await storage.deleteFile(storage.parseKey(channel.room_file_src));
            }
        });
    }

    /**
     * @function createAvatar
     * @description Create a channel webhook avatar (helper function)
     * @param {Object} options
     * @param {String} options.uuid
     * @param {String} options.room_uuid
     * @param {Object} options.file
     * @returns {Promise<String | null>}
     */
    async createAvatar(options = { uuid: null, room_uuid: null, file: null }) {
        if (!options) throw new Error('createAvatar: options is required');
        if (!options.uuid) throw new Error('createAvatar: options.uuid is required');
        if (!options.room_uuid) throw new Error('createAvatar: options.room_uuid is required');

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

const service = new ChannelService();

export default service;
