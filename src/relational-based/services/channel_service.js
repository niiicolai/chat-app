import AdminPermissionRequiredError from '../../shared/errors/admin_permission_required_error.js';
import ExceedsRoomChannelCountError from '../../shared/errors/exceeds_room_channel_count_error.js';
import ExceedsRoomTotalFilesLimitError from '../../shared/errors/exceeds_room_total_files_limit_error.js';
import ExceedsSingleFileSizeError from '../../shared/errors/exceeds_single_file_size_error.js';
import ChannelServiceValidator from '../../shared/validators/channel_service_validator.js';
import EntityNotFoundError from '../../shared/errors/entity_not_found_error.js';
import RoomMemberRequiredError from '../../shared/errors/room_member_required_error.js';
import DuplicateEntryError from '../../shared/errors/duplicate_entry_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RPS from './room_permission_service.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/channel_dto.js';

/**
 * @constant storage
 * @description Storage service instance for channel avatars.
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
        ChannelServiceValidator.findOne(options);

        const entity = await db.ChannelView.findByPk(options.uuid);
        if (!entity) throw new EntityNotFoundError('channel');

        const isInRoom = await RPS.isInRoomByChannel({ channel_uuid: options.uuid, user: options.user, role_name: null });
        if (!isInRoom) throw new RoomMemberRequiredError();

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
        options = ChannelServiceValidator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        const room = await db.RoomView.findOne({ uuid: room_uuid });
        if (!room) throw new EntityNotFoundError('room');

        const isInRoom = await RPS.isInRoom({ room_uuid, user, role_name: null });
        if (!isInRoom) throw new RoomMemberRequiredError();

        const [total, data] = await Promise.all([
            db.ChannelView.count({ room_uuid }),
            db.ChannelView.findAll({
                where: { room_uuid },
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
        ChannelServiceValidator.create(options);

        const { body, file, user } = options;
        const { uuid, name, description, channel_type_name, room_uuid } = body;

        await db.sequelize.transaction(async (transaction) => {
            await Promise.all([
                db.RoomView.findByPk(room_uuid, { transaction }),
                db.ChannelView.findByPk(uuid, { transaction }),
                db.ChannelTypeView.findOne({ where: { channel_type_name }, transaction }),
                db.ChannelView.findOne({ where: { channel_name: name, room_uuid, channel_type_name }, transaction }),
                RPS.isInRoom({ room_uuid, user, role_name: 'Admin' }, transaction),
                RPS.channelCountExceedsLimit({ room_uuid, add_count: 1 }, transaction),
                ...[file && file.size > 0 && [
                    RPS.fileExceedsTotalFilesLimit({ room_uuid, bytes: file.size }, transaction),
                    RPS.fileExceedsSingleFileSize({ room_uuid, bytes: file.size }, transaction)
                ]]
            ]).then(([room, uuidInUse, validType, nameAndTypeInUse, inRoom, channelCountExceedsLimit, exceedTotalFile, exceedSingleFile]) => {
                if (!room) throw new EntityNotFoundError('room');
                if (uuidInUse) throw new DuplicateEntryError('channel', 'uuid', uuid);
                if (!validType) throw new EntityNotFoundError('channel_type');
                if (nameAndTypeInUse) throw new DuplicateEntryError('channel', 'name and type', `${name} and ${channel_type_name}`);
                if (!inRoom) throw new AdminPermissionRequiredError();
                if (channelCountExceedsLimit) throw new ExceedsRoomChannelCountError();
                if (exceedTotalFile) throw new ExceedsRoomTotalFilesLimitError();
                if (exceedSingleFile) throw new ExceedsSingleFileSizeError();
            });

            await db.ChannelView.createChannelProcStatic({
                uuid,
                name,
                description,
                channel_type_name,
                room_uuid,
                bytes: file && file.size > 0 ? file.size : null,
                upload_src: file && file.size > 0 ? await storage.uploadFile(file, uuid) : null
            }, transaction);
        });

        return await db.ChannelView
            .findByPk(uuid)
            .then((channel) => dto(channel));
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
        ChannelServiceValidator.update(options);

        const { uuid, body, file, user } = options;
        const { name, description } = body;

        await db.sequelize.transaction(async (transaction) => {
            const channel = await db.ChannelView.findByPk(uuid, { transaction });
            if (!channel) throw new EntityNotFoundError('channel');

            const isAdmin = await RPS.isInRoomByChannel({ channel_uuid: uuid, user, role_name: 'Admin' }, transaction);
            if (!isAdmin) throw new AdminPermissionRequiredError();

            if (name && name !== channel.channel_name) {
                const nameInUse = await db.ChannelView.findOne({
                    where: { channel_name: name, room_uuid: channel.room_uuid, channel_type_name: channel.channel_type_name },
                    transaction
                });
                if (nameInUse) {
                    throw new DuplicateEntryError(
                        'channel', 'name and channel_type_name', `${name} and ${channel.channel_type_name}`);
                }
            }

            if (file && file.size > 0) {
                await Promise.all([
                    RPS.fileExceedsTotalFilesLimit({ room_uuid: channel.room_uuid, bytes: file.size }, transaction),
                    RPS.fileExceedsSingleFileSize({ room_uuid: channel.room_uuid, bytes: file.size }, transaction)
                ]).then(([totalFilesExceedsLimit, singleFileSizeExceedsLimit]) => {
                    if (totalFilesExceedsLimit) throw new ExceedsRoomTotalFilesLimitError();
                    if (singleFileSizeExceedsLimit) throw new ExceedsSingleFileSizeError();
                });
            }

            await channel.editChannelProc({
                ...(name && { name }),
                ...(description && { description }),
                ...(file && file.size > 0 && {
                    bytes: file.size,
                    src: await storage.uploadFile(file, uuid)
                }),
            }, transaction);

            // Old room file must be deleted last to prevent deleting a file
            // on the object storage and then failing to update the database.
            // This would result in an inconsistent state.
            if (file && file.size > 0 && channel.room_file_uuid) {
                await db.RoomFileView.deleteRoomFileProcStatic({ uuid: channel.room_file_uuid }, transaction);
                await storage.deleteFile(storage.parseKey(channel.room_file_src));
            }
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
        ChannelServiceValidator.destroy(options);

        const { uuid, user } = options;

        await db.sequelize.transaction(async (transaction) => {
            const channel = await db.ChannelView.findByPk(uuid, { transaction });
            if (!channel) throw new EntityNotFoundError('channel');

            const isAdmin = await RPS.isInRoomByChannel({ channel_uuid: uuid, user, role_name: 'Admin' }, transaction);
            if (!isAdmin) throw new AdminPermissionRequiredError();

            await channel.deleteChannelProc(transaction);

            // Old room file must be deleted last to prevent deleting a file
            // on the object storage and then failing to update the database.
            // This would result in an inconsistent state.
            if (channel.room_file_uuid) {
                const key = storage.parseKey(channel.room_file_src);
                await storage.deleteFile(key);
            }
        });
    }
}

const service = new ChannelService();

export default service;
