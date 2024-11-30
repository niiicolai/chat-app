import RoomUserServiceValidator from '../../shared/validators/room_user_service_validator.js';
import EntityNotFoundError from '../../shared/errors/entity_not_found_error.js';
import RoomMemberRequiredError from '../../shared/errors/room_member_required_error.js';
import AdminPermissionRequiredError from '../../shared/errors/admin_permission_required_error.js';
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
        RoomUserServiceValidator.findOne(options);

        const entity = await db.RoomUserView.findByPk(options.uuid);
        if (!entity) throw new EntityNotFoundError('room_user');

        const isInRoom = await RPS.isInRoom({ room_uuid: entity.room_uuid, user: options.user, role_name: null });
        if (!isInRoom) throw new RoomMemberRequiredError();

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
        RoomUserServiceValidator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        const room = await db.RoomView.findOne({ uuid: room_uuid });
        if (!room) throw new EntityNotFoundError('room');

        const isInRoom = await RPS.isInRoom({ room_uuid, user, role_name: null });
        if (!isInRoom) throw new RoomMemberRequiredError();

        const [total, data] = await Promise.all([
            db.RoomUserView.count({ room_uuid }),
            db.RoomUserView.findAll({
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
     * @description Create a room user for a room.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @param {string} options.body
     * @param {string} options.body.room_user_role_name
     * @returns {Promise<Object>}
     */
    async update(options = { uuid: null, body: null, user: null }) {
        RoomUserServiceValidator.update(options);

        const { uuid, body, user } = options;
        const { room_user_role_name } = body;

        await db.sequelize.transaction(async (transaction) => {
            const roomUser = await db.RoomUserView.findOne({
                where: { room_user_uuid: uuid },
                transaction
            });
            if (!roomUser) throw new EntityNotFoundError('room_user');

            const isAdmin = await RPS.isInRoom(
                { room_uuid: roomUser.room_uuid, user, role_name: 'Admin' },
                transaction
            );
            if (!isAdmin) throw new AdminPermissionRequiredError();

            const isValidRole = await db.RoomUserRoleView.findOne({
                where: { name: room_user_role_name },
                transaction
            });
            if (!isValidRole) throw new EntityNotFoundError('room_user_role');

            const replacements = {
                user_uuid: roomUser.user_uuid,
                room_uuid: roomUser.room_uuid,
                role_name: room_user_role_name
            };

            await db.sequelize.query('CALL edit_room_user_role_proc(:user_uuid, :room_uuid, :role_name, @result)', {
                replacements,
                transaction
            });
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
        RoomUserServiceValidator.destroy(options);

        const { uuid, user } = options;
        await db.sequelize.transaction(async (transaction) => {
            const roomUser = await db.RoomUserView.findOne({
                where: { room_user_uuid: uuid },
                transaction
            });
            if (!roomUser) throw new EntityNotFoundError('room_user');

            const isAdmin = await RPS.isInRoom(
                { room_uuid: roomUser.room_uuid, user, role_name: 'Admin' },
                transaction
            );
            if (!isAdmin) throw new AdminPermissionRequiredError();

            await db.sequelize.query('CALL leave_room_proc(:user_uuid, :room_uuid, @result)', {
                replacements: { user_uuid: roomUser.user_uuid, room_uuid: roomUser.room_uuid },
                transaction
            });
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
        RoomUserServiceValidator.findAuthenticatedUser(options);

        const { room_uuid, user } = options;
        
        const entity = await db.RoomUserView.findOne({ where: { 
            user_uuid: user.sub,
            room_uuid, 
        }});

        if (!entity) throw new RoomMemberRequiredError();

        return dto(entity);
    }
}

const service = new RoomUserService();

export default service;
