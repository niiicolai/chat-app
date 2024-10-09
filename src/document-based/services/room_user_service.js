import MongodbBaseFindService from './_mongodb_base_find_service.js';
import ControllerError from '../../shared/errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/user_dto.js';
import RoomUser from '../mongoose/models/room_user.js';
import RoomUserRole from '../mongoose/models/room_user_role.js';
import Room from '../mongoose/models/room.js';
import User from '../mongoose/models/user.js';


class Service extends MongodbBaseFindService {
    constructor() {
        super(RoomUser, dto, 'uuid');
    }

    async findOne(options = { user: null }) {
        const { user } = options;
        const r = await super.findOne({ uuid: options.uuid }, (query) => query
            .populate('room')
            .populate('room_user_role')
            .populate('user'));

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }
        
        if (!(await RoomPermissionService.isInRoom({ room_uuid: r.room.uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return r;
    }

    async findAuthenticatedUser(options = { room_uuid: null, user: null }) {
        const { room_uuid, user } = options;
        const { sub: user_uuid } = user;
        
        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const savedRoom = await Room.findOne({ uuid: room_uuid });
        const savedUser = await User.findOne({ uuid: user_uuid });

        const m = await RoomUser.findOne({ room: savedRoom._id, user: savedUser._id }).populate('room_user_role');

        if (!m) {
            throw new ControllerError(404, 'Room user not found');
        }

        m.room = savedRoom;
        m.user = savedUser;

        return this.dto(m);
    }

    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        const { room_uuid, user, page, limit } = options;

        if (!room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return await super.findAll({ page, limit }, (query) => query
            .populate('room_user_role')
            .populate('room')
            .populate('user'));
    }

    async update(options = { uuid: null, body: null, user: null }) {
        const { uuid, body, user } = options;
        const { room_user_role_name } = body;

        if (!uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }
        if (!room_user_role_name) {
            throw new ControllerError(400, 'No room_user_role_name provided');
        }
        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        const existingRole = await RoomUserRole.findOne({ name: room_user_role_name });
        if (!existingRole) {
            throw new ControllerError(404, 'Room user role not found');
        }

        const existing = await RoomUser.findOne({ uuid }).populate('room')
        if (!existing) {
            throw new ControllerError(404, 'Room user not found');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid: existing.room.uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        await RoomUser.findOneAndUpdate({ uuid }, { room_user_role: existingRole._id });
    }

    async destroy(options = { uuid: null, user: null }) {
        const { uuid, user } = options;
        if (!uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }
        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        const existing = await RoomUser.findOne({ uuid }).populate('room').populate('user');
        if (!existing) {
            throw new ControllerError(404, 'Room user not found');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid: existing.room.uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        await RoomUser.findOneAndDelete({ uuid });
    }
}

const service = new Service();

export default service;
