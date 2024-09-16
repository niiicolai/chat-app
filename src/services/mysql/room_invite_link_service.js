import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';

const service = new MysqlBaseFindService(
    db.RoomInviteLinkView,
    (m) => {
        return {
            uuid: m.room_invite_link_uuid,
            expires_at: m.room_invite_link_expires_at,
            never_expires: m.room_invite_link_never_expires,
            room_uuid: m.room_uuid,
        };
    }
);

service.create = async (options={ body: null, user: null }) => {
    if (!options.body) {
        throw new ControllerError(400, 'No body provided');
    }
    
    const { body } = options;
    
    if (!body.uuid) {
        throw new ControllerError(400, 'No UUID provided');
    }
    if (!body.room_uuid) {
        throw new ControllerError(400, 'No room_uuid provided');
    }
    
    await db.sequelize.query('CALL create_room_invite_link_proc(:uuid, :room_uuid, :expires_at, @result)', {
        replacements: {
            uuid: body.uuid,
            room_uuid: body.room_uuid,
            expires_at: body.expires_at || null,
        },
    });

    return await service.findOne({ room_invite_link_uuid: body.uuid });
};

service.update = async (options={ room_invite_link_uuid: null, body: null, user: null }) => {
    const { room_invite_link_uuid, body, user } = options;
    const { expires_at } = body;
    const { sub: user_uuid } = user;

    if (!room_invite_link_uuid) {
        throw new ControllerError(400, 'No room_invite_link_uuid provided');
    }

    const existing = await service.model.findOne({ where: { room_invite_link_uuid } });
    if (!existing) {
        throw new ControllerError(404, 'Room Invite Link not found');
    }

    await db.sequelize.query('CALL edit_room_invite_link_proc(:room_invite_link_uuid, :expires_at, @result)', {
        replacements: {
            room_invite_link_uuid,
            expires_at: expires_at || null,
        },
    });

    return await service.findOne({ room_invite_link_uuid });
};

service.destroy = async (options={ room_invite_link_uuid: null, user: null }) => {
    const { room_invite_link_uuid, user } = options;
    const { sub: user_uuid } = user;

    if (!room_invite_link_uuid) {
        throw new ControllerError(400, 'No room_invite_link_uuid provided');
    }

    const existing = await service.model.findOne({ where: { room_invite_link_uuid } });
    if (!existing) {
        throw new ControllerError(404, 'Room Invite Link not found');
    }

    await db.sequelize.query('CALL delete_room_invite_link_proc(:room_invite_link_uuid, @result)', {
        replacements: {
            room_invite_link_uuid,
        },
    });
};

service.join = async (options={ room_invite_link_uuid: null, user: null }) => {
    const { room_invite_link_uuid, user } = options;
    const { sub: user_uuid } = user;
    if (!room_invite_link_uuid) {
        throw new ControllerError(400, 'No room_invite_link_uuid provided');
    }

    if (!user_uuid) {
        throw new ControllerError(400, 'No user_uuid provided');
    }

    const existing = await service.model.findOne({ where: { room_invite_link_uuid } });
    if (!existing) {
        throw new ControllerError(404, 'Room Invite Link not found');
    }

    await db.sequelize.query('CALL join_room_proc(:user_uuid, :room_uuid, :role, @result)', {
        replacements: {
            user_uuid,
            room_uuid: existing.room_uuid,
            role: 'Member',
        },
    });
};

export default service;
