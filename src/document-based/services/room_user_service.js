import Validator from '../../shared/validators/room_user_service_validator.js';
import err from '../../shared/errors/index.js';
import RPS from './room_permission_service.js';
import Room from '../mongoose/models/room.js';
import dto from '../dto/room_user_dto.js';

/**
 * @class RoomUserService
 * @description Service class for room users.
 * @exports RoomUserService
 */
class RoomUserService {

    /**
     * @function findOne
     * @description Find a room user by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const { uuid: _id, user } = options;
        const room = await Room
            .where({ room_users: { $elemMatch: { _id } } })
            .findOne()
            .populate('room_users.user');

        const roomUser = room?.room_users?.find(u => u._id === _id);
        if (!roomUser) throw new err.EntityNotFoundError('room_user');

        const isInRoom = await RPS.isInRoom({ room_uuid: room._id, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto({ ...roomUser._doc, room: room._doc });
    }

    /**
     * @function findAuthenticatedUser
     * @description Find the authenticated user in a room by room_uuid
     * @param {Object} options
     * @param {String} options.room_uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async findAuthenticatedUser(options = { room_uuid: null, user: null }) {
        Validator.findAuthenticatedUser(options);

        const { room_uuid: _id, user } = options;
        const room = await Room.findOne({ _id }).populate('room_users.user');
        const roomUser = room?.room_users?.find(u => u.user._id === user.sub);

        if (!room) throw new err.EntityNotFoundError('room_user');
        //console.log(room?.room_users.forEach(u => console.log(u.user._id, user.sub, u.user._id === user.sub)));
        const isInRoom = await RPS.isInRoom({ room_uuid: _id, user });

        if (!isInRoom) throw new err.RoomMemberRequiredError();
        if (!roomUser) throw new err.EntityNotFoundError('room_user');

        return dto({
            ...roomUser._doc,
            room: room._doc,
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
     * @returns {Promise<Object>}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = Validator.findAll(options);

        const { user, room_uuid, page, limit, offset } = options;

        const isInRoom = await RPS.isInRoom({ room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const params = { _id: room_uuid };
        const room = await Room.findOne(params)
            .populate('room_users.user')
            .sort({ created_at: -1 })
            .limit(limit || 0)
            .skip((page && limit) ? offset : 0);

        const total = room.room_users.length;

        return {
            total,
            data: room.room_users.map((room_user) => {
                return dto({ ...room_user._doc, room: room._doc });
            }),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
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
     * @returns {Promise<Object>}
     */
    async update(options = { uuid: null, body: null, user: null }) {
        Validator.update(options);

        const { uuid, body, user } = options;
        let room = await Room.findOne({ 'room_users._id': uuid }).populate('room_users.user');
        let roomUser = room?.room_users?.find(u => u._id === uuid);

        if (!room) throw new err.EntityNotFoundError('room_user');
        if (!roomUser) throw new err.EntityNotFoundError('room_user');

        const isAdmin = await RPS.isInRoom({ room_uuid: room._id, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        try {
            room = await Room.findOneAndUpdate(
                { 'room_users._id': uuid }, 
                { $set: { 'room_users.$.room_user_role': body.room_user_role_name } }
            );
        } catch (error) {
            console.error(error);
            throw error;
        }

        roomUser = room.room_users.find(u => u._id === uuid);

        return dto({ ...roomUser._doc, room: room._doc });
    }

    /**
     * @function destroy
     * @description Destroy a room user by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null, user: null }) {
        Validator.destroy(options);

        const { uuid, user } = options;
        const room = await Room.findOne({ 'room_users._id': uuid }).populate('room_users.user');
        const roomUser = room?.room_users?.find(u => u._id === uuid);

        if (!room) throw new err.EntityNotFoundError('room_user');
        if (!roomUser) throw new err.EntityNotFoundError('room_user');

        const isAdmin = await RPS.isInRoom({ room_uuid: room._id, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        await Room.findOneAndUpdate({ _id: room._id }, { $pull: { room_users: { _id: uuid } } });
    }
}

const service = new RoomUserService();

export default service;
