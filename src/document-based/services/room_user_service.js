import RoomUserServiceValidator from '../../shared/validators/room_user_service_validator.js';
import ControllerError from '../../shared/errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import RoomUserRole from '../mongoose/models/room_user_role.js';
import Room from '../mongoose/models/room.js';
import dto from '../dto/room_user_dto.js';

class Service {

    /**
     * @function findOne
     * @description Find a room user by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Object}
     */
    async findOne(options = { uuid: null, user: null }) {
        RoomUserServiceValidator.findOne(options);

        const room = await Room.where({ room_users: { $elemMatch: { uuid: options.uuid } } }).findOne();
        const roomUser = room?.room_users?.find(u => u.uuid === options.uuid);

        if (!room) throw new ControllerError(404, 'Room user not found');
        if (!roomUser) throw new ControllerError(404, 'Room user not found');
        if (!(await RoomPermissionService.isInRoom({ room_uuid: room.uuid, user: options.user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return dto({ ...roomUser, room });
    }

    /**
     * @function findAuthenticatedUser
     * @description Find the authenticated user in a room by room_uuid
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Object}
     */
    async findAuthenticatedUser(options = { room_uuid: null, user: null }) {
        RoomUserServiceValidator.findAuthenticatedUser(options);

        const room = await Room.findOne({ uuid: options.room_uuid }).populate('room_users.user room_users.room_user_role');
        const roomUser = room?.room_users?.find(u => u.user.uuid === options.user.sub);

        if (!room) throw new ControllerError(404, 'Room not found');
        if (!roomUser) throw new ControllerError(404, 'Room user not found');
        if (!(await RoomPermissionService.isInRoom({ room_uuid: room.uuid, user: options.user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return dto({
            room: room,
            user: options.user,
            room_user_role: roomUser.room_user_role
        });
    }

    /**
     * @function findAll
     * @description Find all room users by room_uuid
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {Number} options.page
     * @param {Number} options.limit
     * @returns {Object}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = RoomUserServiceValidator.findAll(options);
        const { room_uuid, page, limit, offset } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid: options.room_uuid, user: options.user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const params = { uuid: room_uuid };
        const room = await Room.findOne(params)
            .populate('room_users.user room_users.room_user_role')
            .sort({ created_at: -1 })
            .limit(limit || 0)
            .skip((page && limit) ? offset : 0);
        
        return {
            total: room.room_users.length,
            data: await Promise.all(room.room_users.map(async (room_user) => {
                return dto({ ...room_user._doc, room: { uuid: room_uuid } });
            })),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(room.room_users.length / limit) }),
        };
    }

    /**
     * @function update
     * @description Update a room user by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.body
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Object}
     */
    async update(options = { uuid: null, body: null, user: null }) {
        RoomUserServiceValidator.update(options);

        const room = await Room.findOne({ 'room_users.uuid': options.uuid }).populate('room_users.user room_users.room_user_role');
        const roomUser = room?.room_users?.find(u => u.uuid === options.uuid);

        if (!room) throw new ControllerError(404, 'Room not found');
        if (!roomUser) throw new ControllerError(404, 'Room user not found');
        if (!(await RoomPermissionService.isInRoom({ room_uuid: room.uuid, user: options.user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        if (options.body.room_user_role_name) {
            const roomUserRole = await RoomUserRole.findOne({ name: options.body.room_user_role_name });
            if (!roomUserRole) throw new ControllerError(404, 'Room user role not found');
            roomUser.room_user_role = roomUserRole;
        }

        await room.save();

        return dto({ ...roomUser, room });
    }

    /**
     * @function destroy
     * @description Destroy a room user by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {void}
     */
    async destroy(options = { uuid: null, user: null }) {
        RoomUserServiceValidator.destroy(options);

        const room = await Room.findOne({ 'room_users.uuid': options.uuid }).populate('room_users.user room_users.room_user_role');
        const roomUser = room?.room_users?.find(u => u.uuid === options.uuid);

        if (!room) throw new ControllerError(404, 'Room not found');
        if (!roomUser) throw new ControllerError(404, 'Room user not found');
        if (!(await RoomPermissionService.isInRoom({ room_uuid: room.uuid, user: options.user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        await Room.findOneAndUpdate({ uuid: room.uuid }, { $pull: { room_users: { uuid: options.uuid } } });
    }
}

const service = new Service();

export default service;
