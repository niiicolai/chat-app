import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';
import ControllerError from '../../errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../../dto/room_invite_link_dto.js';

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.RoomInviteLinkView, (m) => dto(m, 'room_invite_link_'));
    }

    async findOne(options = { user: null }) {
        const { user } = options;
        const link = await super.findOne({ ...options });

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }
        if (!(await RoomPermissionService.isInRoom({ room_uuid: link.room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }
        return link;
    }

    async findAll(options = { room_uuid: null, user: null }) {
        const { room_uuid, user } = options;

        if (!room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }
        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }
        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return await super.findAll({ ...options, where: { room_uuid } });
    }

    async create(options = { body: null, user: null }) {
        const { body, user } = options;

        if (!body) {
            throw new ControllerError(400, 'No body provided');
        }
        if (!body.uuid) {
            throw new ControllerError(400, 'No UUID provided');
        }

        if (!body.room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }

        if (body.expires_at && new Date(body.expires_at) < new Date()) {
            throw new ControllerError(400, 'The expiration date cannot be in the past');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid: body.room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        let { uuid, room_uuid, expires_at } = body;
        expires_at = expires_at || null;
        
        await db.sequelize.query('CALL create_room_invite_link_proc(:uuid, :room_uuid, :expires_at, @result)', {
            replacements: { uuid, room_uuid, expires_at }
        });

        return await this.findOne({ uuid: body.uuid, user });
    }

    async update(options = { uuid: null, body: null, user: null }) {
        const { uuid, body, user } = options;
        let { expires_at } = body;

        if (!uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }
        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        const existing = await this.findOne({ uuid, user });

        if (expires_at && new Date(expires_at) < new Date()) {
            throw new ControllerError(400, 'The expiration date cannot be in the past');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid: existing.room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        expires_at = expires_at || null;

        await db.sequelize.query('CALL edit_room_invite_link_proc(:uuid, :expires_at, @result)', {
            replacements: { uuid, expires_at }
        });

        return await this.findOne({ uuid, user });
    }

    async destroy(options = { uuid: null, user: null }) {
        const { uuid, user } = options;

        if (!uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }
        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        const existing = await this.findOne({ uuid, user });

        if (!(await RoomPermissionService.isInRoom({ room_uuid: existing.room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        await db.sequelize.query('CALL delete_room_invite_link_proc(:uuid, @result)', {
            replacements: { uuid }
        });
    }

    async join(options = { uuid: null, user: null }) {
        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        if (!uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }
        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        // Note: This cannot use the 'findOne' service method,
        // because that method checks if the user is in the room
        // and the user is currently trying to join the room.
        let existing = await this.model.findOne({ where: { room_invite_link_uuid: uuid } });
        existing = this.dto(existing);

        if (existing.expires_at && new Date(existing.expires_at) < new Date()) {
            throw new ControllerError(400, 'Room Invite Link has expired');
        }

        if (await RoomPermissionService.isInRoom({ room_uuid: existing.room_uuid, user, role_name: null })) {
            throw new ControllerError(400, 'User is already in room');
        }

        if (await RoomPermissionService.roomUserCountExceedsLimit({ room_uuid: existing.room_uuid, add_count: 1 })) {
            throw new ControllerError(400, 'Room user count exceeds limit. The room cannot have more users');
        }

        const room_uuid = existing.room_uuid;
        const role_name = 'Member';

        await db.sequelize.query('CALL join_room_proc(:user_uuid, :room_uuid, :role_name, @result)', {
            replacements: { user_uuid, room_uuid, role_name }
        });
    }
}

const service = new Service();

export default service;
