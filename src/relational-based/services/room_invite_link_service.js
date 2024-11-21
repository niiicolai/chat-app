import RoomInviteLinkServiceValidator from '../../shared/validators/room_invite_link_service_validator.js';
import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../sequelize/models/index.cjs';
import ControllerError from '../../shared/errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/room_invite_link_dto.js';

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.RoomInviteLinkView, dto);
    }

    async findOne(options = { uuid: null, user: null }) {
        RoomInviteLinkServiceValidator.findOne(options);
        const { user } = options;
        const link = await super.findOne({ ...options });

        if (!(await RoomPermissionService.isInRoom({ room_uuid: link.room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }
        return link;
    }

    async findAll(options = { room_uuid: null, user: null }) {
        options = RoomInviteLinkServiceValidator.findAll(options);
        const { room_uuid, user } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return await super.findAll({ ...options, where: { room_uuid } });
    }

    async create(options = { body: null, user: null }) {
        RoomInviteLinkServiceValidator.create(options);
        const { body, user } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid: body.room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        let { uuid, room_uuid, expires_at } = body;

        if (expires_at) {
            // YYYY-MM-DD HH:MM:SS
            expires_at = new Date(expires_at).toISOString().slice(0, 19).replace('T', ' ');
        }
        
        await db.sequelize.query('CALL create_room_invite_link_proc(:uuid, :room_uuid, :expires_at, @result)', {
            replacements: { uuid, room_uuid, expires_at: expires_at || null }
        });

        return await this.findOne({ uuid: body.uuid, user });
    }

    async update(options = { uuid: null, body: null, user: null }) {
        RoomInviteLinkServiceValidator.update(options);
        const { uuid, body, user } = options;
        let { expires_at } = body;

        const existing = await this.findOne({ uuid, user });

        if (!(await RoomPermissionService.isInRoom({ room_uuid: existing.room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        if (expires_at) {
            // YYYY-MM-DD HH:MM:SS
            expires_at = new Date(expires_at).toISOString().slice(0, 19).replace('T', ' ');
        }

        await db.sequelize.query('CALL edit_room_invite_link_proc(:uuid, :expires_at, @result)', {
            replacements: { uuid, expires_at: expires_at || null }
        });

        return await this.findOne({ uuid, user });
    }

    async destroy(options = { uuid: null, user: null }) {
        RoomInviteLinkServiceValidator.destroy(options);

        const { uuid, user } = options;
        const existing = await this.findOne({ uuid, user });

        if (!(await RoomPermissionService.isInRoom({ room_uuid: existing.room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        await db.sequelize.query('CALL delete_room_invite_link_proc(:uuid, @result)', {
            replacements: { uuid }
        });
    }

    async join(options = { uuid: null, user: null }) {
        RoomInviteLinkServiceValidator.join(options);

        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        // Note: This cannot use the 'findOne' service method,
        // because that method checks if the user is in the room
        // and the user is currently trying to join the room.
        let existing = await this.model.findOne({ where: { room_invite_link_uuid: uuid } });
        existing = this.dto(existing);

        if (!(await RoomPermissionService.isVerified({ user }))) {
            throw new ControllerError(403, 'You must verify your email before you can join a room');
        }

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
