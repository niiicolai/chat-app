import MongodbBaseFindService from './_mongodb_base_find_service.js';
import ControllerError from '../../shared/errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/room_invite_link_dto.js';
import RoomInviteLink from '../mongoose/models/room_invite_link.js';
import Room from '../mongoose/models/room.js';
import RoomUser from '../mongoose/models/room_user.js';
import RoomUserRole from '../mongoose/models/room_user_role.js';
import User from '../mongoose/models/user.js';
import { v4 as uuidv4 } from 'uuid';


class Service extends MongodbBaseFindService {
    constructor() {
        super(RoomInviteLink, dto, 'uuid');
    }

    async findOne(options = { uuid: null, user: null }) {
        const { user, uuid } = options;
        const link = await super.findOne({ uuid }, (query) => query.populate('room'));

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid: link.room.uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return link;
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

        const room = await Room.findOne({ uuid: room_uuid });
        if (!room) {
            throw new ControllerError(404, 'Room not found');
        }

        return await super.findAll({ page, limit }, (query) => query, { room: room._id });
    }

    async create(options = { body: null, user: null }) {
        const { body, user } = options;
        const { uuid, room_uuid, expires_at } = body;

        if (!user) throw new ControllerError(500, 'No user provided');
        if (!body) throw new ControllerError(400, 'No body provided');
        if (!uuid) throw new ControllerError(400, 'No UUID provided');
        if (!room_uuid) throw new ControllerError(400, 'No room_uuid provided');

        if (expires_at && new Date(expires_at) < new Date()) {
            throw new ControllerError(400, 'The expiration date cannot be in the past');
        }

        const room = await Room.findOne({ uuid: room_uuid });
        if (!room) {
            throw new ControllerError(404, 'Room not found');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        return this.dto((await new RoomInviteLink({
            uuid,
            room: room._id,
            expires_at,
        }).save()));
    }

    async update(options = { uuid: null, body: null, user: null }) {
        const { uuid, body, user } = options;
        const { expires_at } = body;

        if (!uuid) throw new ControllerError(400, 'No uuid provided');
        if (!user) throw new ControllerError(500, 'No user provided');

        const existing = await RoomInviteLink.findOne({ uuid }).populate('room');
        if (!existing) {
            throw new ControllerError(404, 'Room Invite Link not found');
        }

        if (expires_at && new Date(expires_at) < new Date()) {
            throw new ControllerError(400, 'The expiration date cannot be in the past');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid: existing.room.uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        existing.expires_at = expires_at;

        return this.dto((await existing.save()));
    }

    async destroy(options = { uuid: null, user: null }) {
        const { uuid, user } = options;

        if (!uuid) throw new ControllerError(400, 'No uuid provided');
        if (!user) throw new ControllerError(500, 'No user provided');

        const existing = await RoomInviteLink.findOne({ uuid }).populate('room');
        if (!existing) {
            throw new ControllerError(404, 'Room Invite Link not found');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid: existing.room.uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        await existing.remove();
    }

    async join(options = { uuid: null, user: null }) {
        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        if (!uuid) throw new ControllerError(400, 'No uuid provided');
        if (!user) throw new ControllerError(500, 'No user provided');

        const existing = await RoomInviteLink.findOne({ uuid }).populate('room');
        if (!existing) {
            throw new ControllerError(404, 'Room Invite Link not found');
        }

        if (!(await RoomPermissionService.isVerified({ user }))) {
            throw new ControllerError(403, 'You must verify your email before you can join a room');
        }

        if (existing.expires_at && new Date(existing.expires_at) < new Date()) {
            throw new ControllerError(400, 'Room Invite Link has expired');
        }

        if (await RoomPermissionService.isInRoom({ room_uuid: existing.room.uuid, user, role_name: null })) {
            throw new ControllerError(400, 'User is already in room');
        }

        if (await RoomPermissionService.roomUserCountExceedsLimit({ room_uuid: existing.room.uuid, add_count: 1 })) {
            throw new ControllerError(400, 'Room user count exceeds limit. The room cannot have more users');
        }

        const roomUserRole = await RoomUserRole.findOne({ name: 'User' });
        if (!roomUserRole) {
            throw new ControllerError(500, 'RoomUserRole not found');
        }

        const savedUser = await User.findOne({ uuid: user_uuid });
        if (!savedUser) {
            throw new ControllerError(404, 'User not found');
        }

        await new RoomUser({
            uuid: uuidv4(),
            room: existing.room._id,
            user: savedUser._id,
            role: roomUserRole._id,
        }).save();

        console.warn('mongo db room_invite_link_service.js join message not implemented on join');
    }
}

const service = new Service();

export default service;
