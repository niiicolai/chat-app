import RoomServiceValidator from '../../shared/validators/room_service_validator.js';
import VerifiedEmailRequiredError from '../../shared/errors/verified_email_required_error.js';
import ExceedsRoomTotalFilesLimitError from '../../shared/errors/exceeds_room_total_files_limit_error.js';
import ExceedsSingleFileSizeError from '../../shared/errors/exceeds_single_file_size_error.js';
import AdminPermissionRequiredError from '../../shared/errors/admin_permission_required_error.js';
import RoomMemberRequiredError from '../../shared/errors/room_member_required_error.js';
import EntityNotFoundError from '../../shared/errors/entity_not_found_error.js';
import RoomLeastOneAdminRequiredError from '../../shared/errors/room_least_one_admin_required_error.js';
import DuplicateEntryError from '../../shared/errors/duplicate_entry_error.js';
import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import db from '../sequelize/models/index.cjs';
import RPS from './room_permission_service.js';
import dto from '../dto/room_dto.js';

const DEFAULT_ROOM_TOTAL_UPLOAD_SIZE = process.env.ROOM_TOTAL_UPLOAD_SIZE;
if (!DEFAULT_ROOM_TOTAL_UPLOAD_SIZE) console.error(`
    DEFAULT_ROOM_TOTAL_UPLOAD_SIZE is not defined in the .env file.  
    - RoomService.create is currently not configured correct.
    - Add DEFAULT_ROOM_TOTAL_UPLOAD_SIZE=100000000 to the .env file.
`);

const DEFAULT_ROOM_UPLOAD_SIZE = process.env.ROOM_UPLOAD_SIZE;
if (!DEFAULT_ROOM_UPLOAD_SIZE) console.error(`
    DEFAULT_ROOM_UPLOAD_SIZE is not defined in the .env file.  
    - RoomService.create is currently not configured correct.
    - Add DEFAULT_ROOM_UPLOAD_SIZE=10000000 to the .env file.
`);

/**
 * @constant storage
 * @description Storage service instance for room avatars.
 * @type {StorageService}
 */
const storage = new StorageService('room_avatar');

/**
 * @class RoomService
 * @description Service class for rooms. 
 * @exports RoomService
 */
class RoomService {

    /**
     * @function findOne
     * @description Find a room by UUID.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        RoomServiceValidator.findOne(options);

        const entity = await db.RoomView.findByPk(options.uuid);
        if (!entity) throw new EntityNotFoundError('room');

        const isInRoom = await RPS.isInRoom({ room_uuid: options.uuid, user: options.user, role_name: null });
        if (!isInRoom) throw new RoomMemberRequiredError();

        return dto(entity);
    }

    /**
     * @function findAll
     * @description Find all rooms by room user's user UUID.
     * @param {Object} options
     * @param {string} options.user
     * @param {string} options.user.sub
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { user: null, page: null, limit: null }) {
        RoomServiceValidator.findAll(options);

        const { user, page, limit, offset } = options;

        const params = {
            include: [{
                model: db.RoomUserView,
                where: { user_uuid: user.sub }
            }
            ]
        };

        const [total, data] = await Promise.all([
            db.RoomView.count(params),
            db.RoomView.findAll({
                ...params,
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
     * @description Create a room.
     * @param {Object} options
     * @param {Object} options.body
     * @param {string} options.body.uuid
     * @param {string} options.body.name
     * @param {string} options.body.description
     * @param {string} options.body.room_category_name
     * @param {Object} options.file optional
     * @param {Object} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, file: null, user: null }) {
        RoomServiceValidator.create(options);

        const { body, file, user } = options;

        await db.sequelize.transaction(async (transaction) => {
            await Promise.all([
                RPS.isVerified({ user }, transaction),
                db.RoomView.findOne({ where: { room_uuid: body.uuid }, transaction }),
                db.RoomView.findOne({ where: { room_name: body.name }, transaction }),
                db.RoomCategoryView.findOne({ where: { room_category_name: body.room_category_name }, transaction }),
            ]).then(([isVerified, uuidInUse, nameInUse, validCategory]) => {
                if (!isVerified) throw new VerifiedEmailRequiredError('create a room');
                if (uuidInUse) throw new DuplicateEntryError('room', 'uuid', body.uuid);
                if (nameInUse) throw new DuplicateEntryError('room', 'name', body.name);
                if (!validCategory) throw new EntityNotFoundError('room_category');
            });

            if (file && file.size > 0) {
                if (file.size > parseFloat(DEFAULT_ROOM_TOTAL_UPLOAD_SIZE)) {
                    throw new ControllerError(400, 'The room does not have enough space for this file');
                }
                if (file.size > parseFloat(DEFAULT_ROOM_UPLOAD_SIZE)) {
                    throw new ControllerError(400, 'File exceeds single file size limit');
                }
            }

            await db.RoomView.createRoomProcStatic({
                user_uuid: user.sub,
                uuid: body.uuid,
                name: body.name,
                description: body.description,
                room_category_name: body.room_category_name,
                room_user_role: 'Admin',
                ...(file && file.size > 0 && {
                    bytes: file.size,
                    src: await storage.uploadFile(file, body.uuid),
                }),
            }, transaction);
        });

        return await db.RoomView
            .findByPk(body.uuid)
            .then(entity => dto(entity));
    }

    /**
     * @function update
     * @description Update a room by UUID.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.body
     * @param {string} options.body.name optional
     * @param {string} options.body.description optional
     * @param {string} options.body.room_category_name optional
     * @param {Object} options.file optional
     * @param {Object} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async update(options = { uuid: null, body: null, file: null, user: null }) {
        RoomServiceValidator.update(options);

        const { uuid, body, file, user } = options;
        const { name, description, room_category_name } = body;

        await db.sequelize.transaction(async (transaction) => {
            const room = await db.RoomView.findOne({ where: { room_uuid: uuid }, transaction });
            if (!room) throw new EntityNotFoundError('room');

            const isAdmin = await RPS.isInRoom(
                { room_uuid: uuid, user, role_name: 'Admin' },
                transaction
            );

            if (!isAdmin) throw new AdminPermissionRequiredError();

            if (name && name !== room.name) {
                const nameInUse = await db.RoomView.findOne({ where: { room_name: name }, transaction });
                if (nameInUse) throw new DuplicateEntryError('room', 'name', name);
            }

            if (room_category_name && room_category_name !== room.room_category_name) {
                const validCategory = await db.RoomCategoryView.findOne({ where: { name: room_category_name }, transaction });
                if (!validCategory) throw new EntityNotFoundError('room_category');
            }

            if (file && file.size > 0) {
                await Promise.all([
                    RPS.fileExceedsTotalFilesLimit({ room_uuid: uuid, bytes: file.size }, transaction),
                    RPS.fileExceedsSingleFileSize({ room_uuid: uuid, bytes: file.size }, transaction),
                ]).then(([total, single]) => {
                    if (total) throw new ExceedsRoomTotalFilesLimitError();
                    if (single) throw new ExceedsSingleFileSizeError();
                });
            }

            await room.editRoomProc({
                ...(name && { name }),
                ...(description && { description }),
                ...(room_category_name && { room_category_name }),
                ...(file && file.size > 0 && {
                    bytes: file.size,
                    src: await storage.uploadFile(file, uuid),
                }),
            }, transaction);

            // Old room file must be deleted last to prevent deleting a file
            // on the object storage and then failing to update the database.
            // This would result in an inconsistent state.
            if (file && file.size > 0 && room.room_file_uuid) {
                await db.RoomFileView.deleteRoomFileProcStatic({ uuid: room.room_file_uuid }, transaction);
                await storage.deleteFile(storage.parseKey(room.room_file_src));
            }
        });

        return await db.RoomView
            .findByPk(uuid)
            .then(entity => dto(entity));
    }

    /**
     * @function destroy
     * @description Delete a room by UUID.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null, user: null }) {
        RoomServiceValidator.destroy(options);

        const { uuid, user } = options;

        await db.sequelize.transaction(async (transaction) => {
            const room = await db.RoomView.findByPk(uuid, { transaction });
            if (!room) throw new EntityNotFoundError('room');

            await RPS.isInRoom(
                { room_uuid: uuid, user, role_name: 'Admin' },
                transaction
            ).then((isAdmin) => {
                if (!isAdmin) throw new AdminPermissionRequiredError();
            });

            await room.deleteRoomProc(transaction);

            // Room file must be deleted after the database operation to prevent
            // an inconsistent state.
            if (room.room_file_uuid) {
                const key = storage.parseKey(room.room_file_src);
                await storage.deleteFile(key);
            }
        });
    }

    /**
     * @function editSettings
     * @description Edit a room's settings by UUID.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.body
     * @param {string} options.body.join_message optional
     * @param {string} options.body.rules_text optional
     * @param {string} options.body.join_channel_uuid optional
     * @param {string} options.user
     * @param {string} options.user.sub
     * @returns {Promise<void>}
     */
    async editSettings(options = { uuid: null, body: null, user: null }) {
        RoomServiceValidator.editSettings(options);

        const { uuid, body, user } = options;
        const { join_message, rules_text, join_channel_uuid } = body;

        await db.sequelize.transaction(async (transaction) => {
            const room = await db.RoomView.findByPk(uuid, { transaction });
            if (!room) throw new EntityNotFoundError('room');

            await RPS.isInRoom(
                { room_uuid: uuid, user, role_name: 'Admin' },
                transaction
            ).then((isAdmin) => {
                if (!isAdmin) throw new AdminPermissionRequiredError();
            });

            if (join_message && !join_message.includes('{name}')) {
                throw new ControllerError(400, 'Join message must include {name}');
            }

            if (join_channel_uuid && join_channel_uuid !== room.join_channel_uuid) {
                const channel = await db.ChannelView.findOne({
                    where: { channel_uuid: join_channel_uuid, room_uuid: uuid },
                    transaction
                });
                if (!channel) throw new EntityNotFoundError('channel');
            }

            await room.editRoomSettingProc({
                ...(join_message && { join_message }),
                ...(join_channel_uuid && { join_channel_uuid }),
                ...(rules_text && { rules_text }),
            }, transaction);
        });
    }

    /**
     * @function leave
     * @description Leave a room by UUID.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @returns {Promise<void>}
     */
    async leave(options = { uuid: null, user: null }) {
        RoomServiceValidator.leave(options);

        const { uuid, user } = options;

        await db.sequelize.transaction(async (transaction) => {
            const room = await db.RoomView.findByPk(uuid, { transaction });
            if (!room) throw new EntityNotFoundError('room');

            await Promise.all([
                RPS.isInRoom(
                    { room_uuid: uuid, user, role_name: 'Admin' },
                    transaction
                ),
                db.RoomUserView.count({
                    where: { room_uuid: uuid, room_user_role_name: 'Admin' },
                    transaction
                }),
            ]).then(([isAdmin, roomAdminCount]) => {
                if (isAdmin && roomAdminCount === 1) {
                    throw new RoomLeastOneAdminRequiredError();
                }
            });

            await room.leaveRoomProc({ user_uuid: user.sub }, transaction);
        });
    }
};

const service = new RoomService();

export default service;
