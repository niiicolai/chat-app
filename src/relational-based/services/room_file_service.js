import RoomFileServiceValidator from '../../shared/validators/room_file_service_validator.js';
import OwnershipOrLeastModRequiredError from '../../shared/errors/ownership_or_least_mod_required_error.js';
import EntityNotFoundError from '../../shared/errors/entity_not_found_error.js';
import RoomMemberRequiredError from '../../shared/errors/room_member_required_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RPS from './room_permission_service.js';
import dto from '../dto/room_file_dto.js';
import db from '../sequelize/models/index.cjs';

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

        const entity = await db.RoomFileView.findByPk(options.uuid);
        if (!entity) throw new EntityNotFoundError('room_file');

        const isInRoom = await RPS.isInRoom({ room_uuid: entity.room_uuid, user: options.user, role_name: null });
        if (!isInRoom) throw new RoomMemberRequiredError();

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
        if (!room) throw new EntityNotFoundError('room');

        const isInRoom = await RPS.isInRoom({ room_uuid, user, role_name: null });
        if (!isInRoom) throw new RoomMemberRequiredError();

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
            if (!roomFile) throw new EntityNotFoundError('room_file');

            const [isOwner, isAdmin, isModerator] = await Promise.all([
                this.isOwner({ uuid, isMessageUpload: (roomFile.room_file_type_name === 'MessageUpload'), user }, transaction),
                RPS.isInRoom({ room_uuid: roomFile.room_uuid, user, role_name: 'Admin' }, transaction),
                RPS.isInRoom({ room_uuid: roomFile.room_uuid, user, role_name: 'Moderator' }, transaction),
            ]);

            if (!isOwner && !isAdmin && !isModerator) {
                throw new OwnershipOrLeastModRequiredError('room_file');
            }

            await roomFile.deleteRoomFileProc(transaction);

            // File must be deleted after the database operation to prevent
            // an inconsistent state.
            const key = storage.parseKey(roomFile.src);
            await storage.deleteFile(key);
        });
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
