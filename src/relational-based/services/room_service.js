import Validator from '../../shared/validators/room_service_validator.js';
import StorageService from '../../shared/services/storage_service.js';
import err from '../../shared/errors/index.js';
import db from '../sequelize/models/index.cjs';
import RPS from './room_permission_service.js';
import dto from '../dto/room_dto.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @constant storage
 * @description Storage service instance
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
        Validator.findOne(options);

        const { uuid, user } = options;
        const entity = await db.RoomView.findByPk(uuid);
        if (!entity) throw new err.EntityNotFoundError('room');

        const isInRoom = await RPS.isInRoom({ room_uuid: uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

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
        Validator.findAll(options);

        const { user, page, limit, offset } = options;
        const { sub: user_uuid } = user;
        const params = { include: [{
            model: db.RoomUserView,
            where: { user_uuid }
        }]};

        const [total, data] = await Promise.all([
            db.RoomView.count(params),
            db.RoomView.findAll({
                ...params,
                ...(limit && { limit }),
                ...(offset && { offset }),
                order: [['room_created_at', 'DESC']]
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
        Validator.create(options);

        const { body, file, user } = options;

        let room_file_src = null;
        if (file && file.size > 0) {
            const size = file.size;

            if (file.size > parseFloat(process.env.ROOM_TOTAL_UPLOAD_SIZE)) {
                throw new err.ExceedsRoomTotalFilesLimitError();
            }
            if (file.size > parseFloat(process.env.ROOM_UPLOAD_SIZE)) {
                throw new err.ExceedsSingleFileSizeError();
            }

            room_file_src = await storage.uploadFile(file, body.uuid);
        }

        await db.sequelize.transaction(async (transaction) => {
            const isVerified = await RPS.isVerified({ user }, transaction);
            if (!isVerified) throw new err.VerifiedEmailRequiredError('create a room');

            await db.RoomView.createRoomProcStatic({
                uuid: body.uuid,
                name: body.name,
                description: body.description,
                room_category_name: body.room_category_name,
            }, transaction);

            await db.RoomView.joinRoomProcStatic({
                user_uuid: user.sub,
                room_uuid: body.uuid,
                role_name: 'Admin',
            }, transaction);

            if (room_file_src) {
                const room_file_uuid = (room_file_src ? uuidv4() : null);
                await db.RoomFileView.createRoomFileProcStatic({
                    room_file_uuid: room_file_uuid,
                    room_file_src,
                    room_file_size: file.size,
                    room_uuid: body.uuid,
                    room_file_type_name: 'RoomAvatar',
                }, transaction);
                await db.RoomView.editRoomAvatarProcStatic({ room_uuid: body.uuid, room_file_uuid }, transaction);
            }

        }).catch((error) => {
            // Delete the avatar file if it was uploaded
            if (room_file_src) storage.deleteFile(storage.parseKey(room_file_src));

            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new err.DuplicateEntryError('room', error.errors[0].path, error.errors[0].value);
            } else if (error.name === 'SequelizeForeignKeyConstraintError') {
                throw new err.EntityNotFoundError(error.fields[0]);
            }
            console.error(error);

            throw error;
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
        Validator.update(options);

        const { uuid, body, file, user } = options;
        const { name, description, room_category_name } = body;

        let room_file_src = null;
        if (file && file.size > 0) {
            const [exceedsTotal, exceedsSingle] = await Promise.all([
                RPS.fileExceedsTotalFilesLimit({ room_uuid: uuid, bytes: file.size }),
                RPS.fileExceedsSingleFileSize({ room_uuid: uuid, bytes: file.size }),
            ]);
            if (exceedsTotal) throw new err.ExceedsRoomTotalFilesLimitError();
            if (exceedsSingle) throw new err.ExceedsSingleFileSizeError();

            room_file_src = await storage.uploadFile(file, uuid);
        }

        await db.sequelize.transaction(async (transaction) => {
            const [room, isAdmin] = await Promise.all([
                db.RoomView.findByPk(uuid, { transaction }),
                RPS.isInRoom({ room_uuid: uuid, user, role_name: 'Admin' }, transaction)
            ]);

            if (!room) throw new err.EntityNotFoundError('room');
            if (!isAdmin) throw new err.AdminPermissionRequiredError();

            await room.editRoomProc({
                ...(name && { name }),
                ...(description && { description }),
                ...(room_category_name && { room_category_name }),
            }, transaction);

            if (room_file_src) {
                const room_file_uuid = uuidv4();
                await db.RoomFileView.createRoomFileProcStatic({
                    room_file_uuid,
                    room_file_src,
                    room_file_size: file.size,
                    room_uuid: uuid,
                    room_file_type_name: 'RoomAvatar',
                }, transaction);
                await room.editRoomAvatarProc({ room_file_uuid }, transaction);

                if (room.room_file_uuid) {
                    await db.RoomFileView.deleteRoomFileProcStatic({ uuid: room.room_file_uuid }, transaction);
                    await storage.deleteFile(storage.parseKey(room.room_file_src));
                }
            }

        }).catch((error) => {
            // Delete the avatar file if it was uploaded
            if (room_file_src) storage.deleteFile(storage.parseKey(room_file_src));

            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new err.DuplicateEntryError('room', error.errors[0].path, error.errors[0].value);
            } else if (error.name === 'SequelizeForeignKeyConstraintError') {
                throw new err.EntityNotFoundError(error.fields[0]);
            }
            throw error;
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
        Validator.destroy(options);

        const { uuid, user } = options;

        await db.sequelize.transaction(async (transaction) => {
            const room = await db.RoomView.findByPk(uuid, { transaction });
            if (!room) throw new err.EntityNotFoundError('room');

            const isAdmin = await RPS.isInRoom({ room_uuid: uuid, user, role_name: 'Admin' }, transaction);
            if (!isAdmin) throw new err.AdminPermissionRequiredError();

            await room.deleteRoomProc(transaction);

            if (room.room_file_uuid) {
                await db.RoomFileView.deleteRoomFileProcStatic({ uuid: room.room_file_uuid }, transaction);
                await storage.deleteFile(storage.parseKey(room.room_file_src));
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
        Validator.editSettings(options);

        const { uuid, body, user } = options;
        const { join_message, rules_text, join_channel_uuid } = body;

        if (join_message && !join_message.includes('{name}')) {
            throw new err.ControllerError(400, 'Join message must include {name}');
        }

        await db.sequelize.transaction(async (transaction) => {
            const room = await db.RoomView.findByPk(uuid, { transaction });
            if (!room) throw new err.EntityNotFoundError('room');

            const isAdmin = await RPS.isInRoom({ room_uuid: uuid, user, role_name: 'Admin' }, transaction);
            if (!isAdmin) throw new err.AdminPermissionRequiredError();

            await room.editRoomSettingProc({
                ...(join_message && { join_message }),
                ...(join_channel_uuid && { join_channel_uuid }),
                ...(rules_text && { rules_text }),
            }, transaction);

        }).catch((error) => {
            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new err.DuplicateEntryError('room', error.errors[0].path, error.errors[0].value);
            } else if (error.name === 'SequelizeForeignKeyConstraintError') {
                throw new err.EntityNotFoundError(error.fields[0]);
            }
            throw error;
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
        Validator.leave(options);

        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        await db.sequelize.transaction(async (transaction) => {
            const room = await db.RoomView.findByPk(uuid, { transaction });
            if (!room) throw new err.EntityNotFoundError('room');

            await Promise.all([
                RPS.isInRoom({ room_uuid: uuid, user, role_name: 'Admin' }, transaction),
                db.RoomUserView.count({ where: { room_uuid: uuid, room_user_role_name: 'Admin' }, transaction }),
            ]).then(([isAdmin, roomAdminCount]) => {
                if (isAdmin && roomAdminCount === 1) {
                    throw new RoomLeastOneAdminRequiredError();
                }
            });

            await room.leaveRoomProc({ user_uuid }, transaction);
        });
    }
};

const service = new RoomService();

export default service;
