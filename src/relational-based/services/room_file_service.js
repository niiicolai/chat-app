import RoomFileServiceValidator from '../../shared/validators/room_file_service_validator.js';
import StorageService from '../../shared/services/storage_service.js';
import err from '../../shared/errors/index.js';
import RPS from './room_permission_service.js';
import dto from '../dto/room_file_dto.js';
import db from '../sequelize/models/index.cjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * @constant storage
 * @description Storage service instance for room files.
 * @type {StorageService}
 */
const storage = new StorageService('room_file');

/**
 * @class RoomFileService
 * @description Service class for room files.
 * @exports RoomFileService
 */
class RoomFileService {

    /**
     * @function findOne
     * @description Find a room file by UUID.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        RoomFileServiceValidator.findOne(options);

        const { uuid, user } = options;
        const entity = await db.RoomFileView.findByPk(uuid);
        
        if (!entity) throw new err.EntityNotFoundError('room_file');

        const isInRoom = await RPS.isInRoom({ room_uuid: entity.room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto(entity);
    }

    /**
     * @function findAll
     * @description Find all room files by room UUID.
     * @param {Object} options
     * @param {string} options.room_uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = RoomFileServiceValidator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;
        const room = await db.RoomView.findOne({ uuid: room_uuid });

        if (!room) throw new err.EntityNotFoundError('room');

        const isInRoom = await RPS.isInRoom({ room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const [total, data] = await Promise.all([
            db.RoomFileView.count({ room_uuid }),
            db.RoomFileView.findAll({
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
     * @description Create a room file.
     * @param {Object} options
     * @param {Object} options.file
     * @param {Object} options.body
     * @param {string} options.body.uuid optional
     * @param {string} options.body.room_uuid
     * @param {string} options.body.room_file_type_name
     * @param {Object} options.user
     * @param {string} options.user.sub
     * @param {Object} transaction optional
     * @returns {Promise<Object>}
     */
    async create(options = { file: null, body: null, user: null }, transaction = null) {
        RoomFileServiceValidator.create(options);

        const { file, body, user } = options;

        if (!body.uuid) body.uuid = uuidv4();

        await Promise.all([
            db.RoomView.findOne({ uuid: body.room_uuid }, { ...(transaction && { transaction }) }),
            db.RoomFileTypeView.findOne({ room_file_type_name: body.room_file_type_name }, { ...(transaction && { transaction }) }),
            RPS.fileExceedsTotalFilesLimit({ room_uuid: body.room_uuid, bytes: file.size }, transaction),
            RPS.fileExceedsSingleFileSize({ room_uuid: body.room_uuid, bytes: file.size }, transaction),
        ]).then(([room, fileType, exceedsTotalFilesLimit, exceedsSingleFileSize]) => {
            if (!room) throw new err.EntityNotFoundError('room');
            if (!fileType) throw new err.EntityNotFoundError('room_file_type');
            if (exceedsTotalFilesLimit) throw new err.ExceedsRoomTotalFilesLimitError();
            if (exceedsSingleFileSize) throw new err.ExceedsSingleFileSizeError();
        });

        // Only admins can upload files that are not message uploads.
        const role_name = body.room_file_type_name === 'MessageUpload' ? null : 'Admin';
        await RPS.isInRoom({ room_uuid: body.room_uuid, user, role_name }, transaction)
            .then((isInRoom) => {
                if (!isInRoom) throw new err.RoomMemberRequiredError();
            });

        const src = await storage.uploadFile(file, body.uuid);
        
        await db.RoomFileView.createRoomFileProcStatic({
            room_file_uuid: body.uuid,
            room_file_src: src,
            room_file_size: file.size,
            room_uuid: body.room_uuid,
            room_file_type_name: body.room_file_type_name
        }, transaction);

        return { ...body, src, size: file.size }
    }

    /**
     * @function destroy
     * @description Delete a room file by UUID.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null, user: null }) {
        RoomFileServiceValidator.destroy(options);

        const { uuid, user } = options;

        await db.sequelize.transaction(async (transaction) => {
            const roomFile = await db.RoomFileView.findByPk(uuid, { transaction });
            if (!roomFile) throw new err.EntityNotFoundError('room_file');

            const [isOwner, isAdmin, isModerator] = await Promise.all([
                this.isOwner({ uuid, isMessageUpload: (roomFile.room_file_type_name === 'MessageUpload'), user }, transaction),
                RPS.isInRoom({ room_uuid: roomFile.room_uuid, user, role_name: 'Admin' }, transaction),
                RPS.isInRoom({ room_uuid: roomFile.room_uuid, user, role_name: 'Moderator' }, transaction),
            ]);

            if (!isOwner && !isAdmin && !isModerator) {
                throw new err.OwnershipOrLeastModRequiredError('room_file');
            }

            await this.remove(uuid, roomFile.room_file_src, transaction);
        });
    }

    /**
     * @function remove
     * @description Remove a room file by UUID and source.
     * @param {string} room_file_uuid
     * @param {string} src
     * @param {Object} transaction optional
     * @returns {Promise<void>}
     */
    async remove(room_file_uuid, src, transaction = null) {
        if (!room_file_uuid || !src) throw new err.ValidationError('room_file_uuid and src are required');

        await db.RoomFileView.deleteRoomFileProcStatic({ uuid: room_file_uuid }, transaction);

        // File must be deleted after the database operation to prevent
        // an inconsistent state.
        const key = storage.parseKey(src);
        await storage.deleteFile(key);
    }

    /**
     * @function isOwner
     * @description Check if a user is the owner of a room file.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {boolean} options.isMessageUpload
     * @param {string} options.user
     * @param {string} options.user.sub
     * @param {Object} transaction optional
     * @returns {Promise<boolean>}
     */
    async isOwner(options = { uuid: null, isMessageUpload: null, user: null }, transaction = null) {
        RoomFileServiceValidator.isOwner(options);

        const { uuid, isMessageUpload, user } = options;

        if (!isMessageUpload) return false;

        const { messageUpload } = await db.ChannelMessage.findOne({
            include: [{ model: db.ChannelMessageUpload, where: { uuid } }],
            transaction
        });

        return messageUpload && messageUpload.user_uuid === user.uuid;
    }
};

const service = new RoomFileService();

export default service;
