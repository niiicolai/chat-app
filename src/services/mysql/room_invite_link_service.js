import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';
import ControllerError from '../../errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';

const dto = (m) => {
    return {
        uuid: m.room_invite_link_uuid,
        expires_at: m.room_invite_link_expires_at,
        never_expires: m.room_invite_link_never_expires,
        room_uuid: m.room_uuid,
    };
};

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.RoomInviteLinkView, dto);
    }

    async findOne(options = { user: null }) {
        const { user } = options;
        const link = await super.findOne({ ...options });
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
        console.log(body);
        if (!body.room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid: body.room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }
        
        await db.sequelize.query('CALL create_room_invite_link_proc(:uuid, :room_uuid, :expires_at, @result)', {
            replacements: {
                uuid: body.uuid,
                room_uuid: body.room_uuid,
                expires_at: body.expires_at || null,
            },
        });

        return await this.findOne({ room_invite_link_uuid: body.uuid, user });
    }

    async update(options = { room_invite_link_uuid: null, body: null, user: null }) {
        const { room_invite_link_uuid, body, user } = options;
        const { expires_at } = body;

        if (!room_invite_link_uuid) {
            throw new ControllerError(400, 'No room_invite_link_uuid provided');
        }

        const existing = await this.model.findOne({ where: { room_invite_link_uuid } });
        if (!existing) {
            throw new ControllerError(404, 'Room Invite Link not found');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid: existing.room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        await db.sequelize.query('CALL edit_room_invite_link_proc(:room_invite_link_uuid, :expires_at, @result)', {
            replacements: {
                room_invite_link_uuid,
                expires_at: expires_at || null,
            },
        });

        return await this.findOne({ room_invite_link_uuid, user });
    }

    async destroy(options = { room_invite_link_uuid: null, user: null }) {
        const { room_invite_link_uuid, user } = options;

        if (!room_invite_link_uuid) {
            throw new ControllerError(400, 'No room_invite_link_uuid provided');
        }

        const existing = await this.model.findOne({ where: { room_invite_link_uuid } });
        if (!existing) {
            throw new ControllerError(404, 'Room Invite Link not found');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid: existing.room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        await db.sequelize.query('CALL delete_room_invite_link_proc(:room_invite_link_uuid, @result)', {
            replacements: {
                room_invite_link_uuid,
            },
        });
    }

    async join(options = { room_invite_link_uuid: null, user: null }) {
        const { room_invite_link_uuid, user } = options;
        const { sub: user_uuid } = user;

        if (!room_invite_link_uuid) {
            throw new ControllerError(400, 'No room_invite_link_uuid provided');
        }

        const existing = await this.model.findOne({ where: { room_invite_link_uuid } });
        if (!existing) {
            throw new ControllerError(404, 'Room Invite Link not found');
        }

        if (existing.room_invite_link_expires_at && new Date(existing.room_invite_link_expires_at) < new Date()) {
            throw new ControllerError(400, 'Room Invite Link has expired');
        }

        if (await RoomPermissionService.isInRoom({ room_uuid: existing.room_uuid, user, role_name: null })) {
            throw new ControllerError(400, 'User is already in room');
        }

        await db.sequelize.query('CALL join_room_proc(:user_uuid, :room_uuid, :role_name, @result)', {
            replacements: {
                user_uuid,
                room_uuid: existing.room_uuid,
                role_name: 'Member',
            },
        });
    }
}

const service = new Service();

export default service;
