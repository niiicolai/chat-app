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
    async create(options={ body: null, file: null, user: null }) {
        ChannelServiceValidator.create(options);

        const { body, file, user } = options;
        const { uuid, name, description, channel_type_name, room_uuid } = body;

        await db.sequelize.transaction(async (transaction) => {
            const room = await db.RoomView.findByPk(room_uuid, { transaction });
            if (!room) throw new EntityNotFoundError('room');

            const uuidInUse = await db.ChannelView.findByPk(uuid, { transaction });
            if (uuidInUse) throw new DuplicateEntryError('channel', 'uuid', uuid);

            const validType = await db.ChannelType.findOne({ where: { channel_type_name }, transaction });
            if (!validType) throw new EntityNotFoundError('channel_type');

            const nameAndTypeInUse = await db.ChannelView.findOne({ 
                where: { channel_name: name, room_uuid, channel_type_name },
                transaction 
            });
            if (nameAndTypeInUse) throw new DuplicateEntryError(
                'channel', 'name and type', `${name} and ${channel_type_name}`);

            const [inRoom, channelCountExceedsLimit] = await Promise.all([
                RPS.isInRoom({ room_uuid, user, role_name: 'Admin' }),
                RPS.channelCountExceedsLimit({ room_uuid, add_count: 1 })
            ]);

            if (!inRoom) throw new AdminPermissionRequiredError();
            if (channelCountExceedsLimit) throw new ExceedsRoomChannelCountError();
            
            const replacements = {
                uuid,
                name,
                description,
                channel_type_name,
                bytes: null,
                upload_src: null,
                room_uuid
            };
            
            if (file && file.size > 0) {
                const [totalFilesExceedsLimit, singleFileSizeExceedsLimit] = await Promise.all([
                    RPS.fileExceedsTotalFilesLimit({ room_uuid, bytes: file.size }),
                    RPS.fileExceedsSingleFileSize({ room_uuid, bytes: file.size })
                ]);

                if (totalFilesExceedsLimit) throw new ExceedsRoomTotalFilesLimitError();
                if (singleFileSizeExceedsLimit) throw new ExceedsSingleFileSizeError();

                replacements.src = await storage.uploadFile(file, uuid);
                replacements.bytes = file.size;
            }

            await db.sequelize.query('CALL create_channel_proc(:uuid, :name, :description, :channel_type_name, :bytes, :upload_src, :room_uuid, @result)', {
                replacements,
                transaction
            });
        });

        return await db.ChannelView.findByPk(uuid)
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
    async update(options={ uuid: null, body: null, file: null, user: null }) {
        ChannelServiceValidator.update(options);

        const { uuid, body, file, user } = options;
        const { name, description } = body;

        await db.sequelize.transaction(async (transaction) => {

            const channel = await db.ChannelView.findByPk(uuid, { transaction });
            if (!channel) throw new EntityNotFoundError('channel');

            const isAdmin = await RPS.isInRoomByChannel({ channel_uuid: uuid, user, role_name: 'Admin' });
            if (!isAdmin) throw new AdminPermissionRequiredError();

            if (name && name !== channel.channel_name) {
                const nameInUse = await db.ChannelView.findOne({ 
                    where: { channel_name: name, room_uuid: channel.room_uuid, channel_type_name: channel.channel_type_name },
                    transaction 
                });
                if (nameInUse) throw new DuplicateEntryError('channel', 'name', name);
            }

            const replacements = {
                uuid,
                name: name || channel.channel_name,
                description: description || channel.channel_description,
                channel_type_name: channel.channel_type_name,
                bytes: channel.room_file_size,
                src: channel.room_file_src,
                room_uuid: channel.room_uuid
            };

            if (file && file.size > 0) {
                const [totalFilesExceedsLimit, singleFileSizeExceedsLimit] = await Promise.all([
                    RPS.fileExceedsTotalFilesLimit({ room_uuid: channel.room_uuid, bytes: file.size }),
                    RPS.fileExceedsSingleFileSize({ room_uuid: channel.room_uuid, bytes: file.size })
                ]);

                if (totalFilesExceedsLimit) throw new ExceedsRoomTotalFilesLimitError();
                if (singleFileSizeExceedsLimit) throw new ExceedsSingleFileSizeError();

                replacements.src = await storage.uploadFile(file, uuid);
                replacements.bytes = file.size;
            }

            await db.sequelize.query('CALL edit_channel_proc(:uuid, :name, :description, :channel_type_name, :bytes, :src, :room_uuid, @result)', {
                replacements,
                transaction
            });
                
            // Old room file must be deleted last to prevent deleting a file
            // on the object storage and then failing to update the database.
            // This would result in an inconsistent state.
            if (file && file.size > 0 && channel.room_file_uuid) {
                await db.sequelize.query('CALL delete_room_file_proc(:uuid, @result)', {
                    replacements: { uuid: channel.room_file_uuid },
                    transaction
                });
                await storage.deleteFile(storage.parseKey(channel.room_file_src));
            }
        });

        return await db.ChannelView.findByPk(uuid)
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
    async destroy(options={ uuid: null, user: null }) {
        ChannelServiceValidator.destroy(options);

        const { uuid, user } = options;

        await db.sequelize.transaction(async (transaction) => {
            const channel = await db.ChannelView.findByPk(uuid, { transaction });
            if (!channel) throw new EntityNotFoundError('channel');

            const isAdmin = await RPS.isInRoomByChannel({ channel_uuid: uuid, user, role_name: 'Admin' });
            if (!isAdmin) throw new AdminPermissionRequiredError();

            await db.sequelize.query('CALL delete_channel_proc(:uuid, @result)', {
                replacements: { uuid },
                transaction
            });

            // Old room file must be deleted last to prevent deleting a file
            // on the object storage and then failing to update the database.
            // This would result in an inconsistent state.
            if (channel.room_file_uuid) {
                await storage.deleteFile(storage.parseKey(channel.room_file_src));
            }
        });
    }
}

const service = new ChannelService();

export default service;
