import Validator from '../../shared/validators/room_user_service_validator.js';
import err from '../../shared/errors/index.js';
import RPS from './room_permission_service.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/room_user_dto.js';

/**
 * @class RoomUserService
 * @description Service class for room users.
 * @exports RoomUserService
 */
class RoomUserService {

    /**
     * @function findOne
     * @description Find a room user by UUID.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const { uuid, user } = options;
        const entity = await db.RoomUserView.findByPk(uuid);

        if (!entity) throw new err.EntityNotFoundError('room_user');

        const isInRoom = await RPS.isInRoom({ room_uuid: entity.room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto(entity);
    }

    /**
     * @function findAll
     * @description Find all room users by room UUID.
     * @param {Object} options
     * @param {string} options.room_uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        Validator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        const room = await db.RoomView.findOne({ uuid: room_uuid });
        if (!room) throw new err.EntityNotFoundError('room');

        const isInRoom = await RPS.isInRoom({ room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const [total, data] = await Promise.all([
            db.RoomUserView.count({ room_uuid }),
            db.RoomUserView.findAll({
                where: { room_uuid },
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
     * @function update
     * @description Update a room user by UUID.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @param {string} options.body
     * @param {string} options.body.room_user_role_name
     * @returns {Promise<Object>}
     */
    async update(options = { uuid: null, body: null, user: null }) {
        Validator.update(options);

        const { uuid, body, user } = options;
        const { room_user_role_name } = body;

        await db.sequelize.transaction(async (transaction) => {
            const roomUser = await db.RoomUserView.findOne({
                where: { room_user_uuid: uuid },
                transaction
            });
            if (!roomUser) throw new err.EntityNotFoundError('room_user');

            const room_uuid = roomUser.room_uuid;
            const isAdmin = await RPS.isInRoom({ room_uuid, user, role_name: 'Admin' }, transaction);
            if (!isAdmin) throw new err.AdminPermissionRequiredError();

            await roomUser.editRoomUserProc({
                ...(room_user_role_name && { role_name: room_user_role_name }),
            }, transaction);
            
        }).catch((error) => {
            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new err.DuplicateEntryError('room', error.errors[0].path, error.errors[0].value);
            } else if (error.name === 'SequelizeForeignKeyConstraintError') {
                throw new err.EntityNotFoundError(error.fields[0]);
            }
            console.error(error);

            throw error;
        });
    }

    /**
     * @function destroy
     * @description Destroy a room user by UUID.
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
            const roomUser = await db.RoomUserView.findOne({
                where: { room_user_uuid: uuid },
                transaction
            });
            if (!roomUser) throw new err.EntityNotFoundError('room_user');

            const room_uuid = roomUser.room_uuid;
            const isAdmin = await RPS.isInRoom({ room_uuid, user, role_name: 'Admin' }, transaction);
            if (!isAdmin) throw new err.AdminPermissionRequiredError();

            await db.RoomView.leaveRoomProcStatic({ user_uuid: roomUser.user_uuid, room_uuid }, transaction);

        }).catch((error) => {
            console.error(error);
            throw error;
        });
    }

    /**
     * @function findAuthenticatedUser
     * @description Find the room user by user UUID and room UUID.
     * @param {Object} options
     * @param {string} options.room_uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async findAuthenticatedUser(options = { room_uuid: null, user: null }) {
        Validator.findAuthenticatedUser(options);

        const { room_uuid, user } = options;
        const { sub: user_uuid } = user;
        
        const entity = await db.RoomUserView.findOne({ where: { user_uuid, room_uuid }});
        if (!entity) throw new err.RoomMemberRequiredError();

        return dto(entity);
    }
}

const service = new RoomUserService();

export default service;
