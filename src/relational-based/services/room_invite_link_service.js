import RoomInviteLinkServiceValidator from '../../shared/validators/room_invite_link_service_validator.js';
import AdminPermissionRequiredError from '../../shared/errors/admin_permission_required_error.js';
import VerifiedEmailRequiredError from '../../shared/errors/verified_email_required_error.js';
import ExceedsRoomUserCountError from '../../shared/errors/exceeds_room_user_count_error.js';
import RoomMemberRequiredError from '../../shared/errors/room_member_required_error.js';
import DuplicateRoomUserError from '../../shared/errors/duplicate_room_user_error.js';
import EntityNotFoundError from '../../shared/errors/entity_not_found_error.js';
import EntityExpiredError from '../../shared/errors/entity_expired_error.js';
import DuplicateEntryError from '../../shared/errors/duplicate_entry_error.js';
import RPS from './room_permission_service.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/room_invite_link_dto.js';

/**
 * @class RoomInviteLinkService
 * @description Service class for room invite links. 
 * @exports RoomFileService
 */
class RoomInviteLinkService {

    /**
     * @function findOne
     * @description Find a room invite link by UUID.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        RoomInviteLinkServiceValidator.findOne(options);

        const entity = await db.RoomInviteLinkView.findByPk(options.uuid);
        if (!entity) throw new EntityNotFoundError('room_audit');

        const isInRoom = await RPS.isInRoom({ room_uuid: entity.room_uuid, user: options.user, role_name: null });
        if (!isInRoom) throw new RoomMemberRequiredError();

        return dto(entity);
    }

    /**
     * @function findAll
     * @description Find all room invite links by room UUID.
     * @param {Object} options
     * @param {string} options.room_uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = RoomInviteLinkServiceValidator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        const room = await db.RoomView.findOne({ uuid: room_uuid });
        if (!room) throw new EntityNotFoundError('room');

        const isInRoom = await RPS.isInRoom({ room_uuid, user, role_name: null });
        if (!isInRoom) throw new RoomMemberRequiredError();

        const [total, data] = await Promise.all([
            db.RoomInviteLinkView.count({ room_uuid }),
            db.RoomInviteLinkView.findAll({
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
     * @description Create a room invite link.
     * @param {Object} options
     * @param {Object} options.body
     * @param {string} options.body.uuid
     * @param {string} options.body.room_uuid
     * @param {string} options.body.expires_at optional
     * @param {string} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, user: null }) {
        RoomInviteLinkServiceValidator.create(options);

        const { body, user } = options;

        const isAdmin = await RPS.isInRoom({ room_uuid: body.room_uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new AdminPermissionRequiredError();

        const uuidInUse = await db.RoomInviteLinkView.findByPk(body.uuid);
        if (uuidInUse) throw new DuplicateEntryError('room_invite_link', 'uuid', body.uuid);

        const replacements = {
            uuid: body.uuid,
            room_uuid: body.room_uuid,
            expires_at: body.expires_at 
                ? new Date(body.expires_at).toISOString().slice(0, 19).replace('T', ' ') // YYYY-MM-DD HH:MM:SS
                : null
        }

        await db.sequelize.query('CALL create_room_invite_link_proc(:uuid, :room_uuid, :expires_at, @result)', {
            replacements
        });

        return await db.sequelize.RoomInviteLinkView.findByPk(body.uuid)
            .then(entity => dto(entity));
    }

    /**
     * @function update
     * @description Update a room invite link by UUID.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.body
     * @param {string} options.body.expires_at optional
     * @param {string} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async update(options = { uuid: null, body: null, user: null }) {
        RoomInviteLinkServiceValidator.update(options);

        const { uuid, body, user } = options;

        const roomInviteLink = await db.RoomInviteLinkView.findByPk(uuid);
        if (!roomInviteLink) throw new EntityNotFoundError('room_invite_link');

        const isAdmin = await RPS.isInRoom({ room_uuid: roomInviteLink.room_uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new AdminPermissionRequiredError();

        const replacements = {
            uuid,
            expires_at: body.expires_at
                ? new Date(body.expires_at).toISOString().slice(0, 19).replace('T', ' ') // YYYY-MM-DD HH:MM:SS
                : roomInviteLink.expires_at
        }

        await db.sequelize.query('CALL edit_room_invite_link_proc(:uuid, :expires_at, @result)', {
            replacements
        });

        return await db.sequelize.RoomInviteLinkView.findByPk(uuid)
            .then(entity => dto(entity));
    }

    /**
     * @function destroy
     * @description Delete a room invite link by UUID.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null, user: null }) {
        RoomInviteLinkServiceValidator.destroy(options);

        const { uuid, user } = options;

        const roomInviteLink = await db.RoomInviteLinkView.findByPk(uuid);
        if (!roomInviteLink) throw new EntityNotFoundError('room_invite_link');

        const isAdmin = await RPS.isInRoom({ room_uuid: roomInviteLink.room_uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new AdminPermissionRequiredError();

        await db.sequelize.query('CALL delete_room_invite_link_proc(:uuid, @result)', {
            replacements: { uuid }
        });
    }

    /**
     * @function join
     * @description Join a room using a room invite link.
     * @param {Object} options
     * @param {string} options.uuid
     * @param {string} options.user
     * @param {string} options.user.sub
     * @returns {Promise<void>}
     */
    async join(options = { uuid: null, user: null }) {
        RoomInviteLinkServiceValidator.join(options);

        const { uuid, user } = options;
        
        await db.sequelize.transaction(async (transaction) => {
            const roomInviteLink = await db.RoomInviteLinkView.findOne({ where: { room_invite_link_uuid: uuid }, transaction });
            if (!roomInviteLink) throw new EntityNotFoundError('room_invite_link');

            if (roomInviteLink.expires_at && new Date(roomInviteLink.expires_at) < new Date()) {
                throw new EntityExpiredError('room_invite_link');
            }

            const [isInRoom, isUserEmailVerified, roomUserCountExceedsLimit] = await Promise.all([
                RPS.isInRoom({ room_uuid: roomInviteLink.room_uuid, user, role_name: null }, transaction),
                RPS.isVerified({ user }, transaction),
                RPS.roomUserCountExceedsLimit({ room_uuid: roomInviteLink.room_uuid, add_count: 1 }, transaction)
            ]);

            if (isInRoom) throw new DuplicateRoomUserError();
            if (!isUserEmailVerified) throw new VerifiedEmailRequiredError('join a room');
            if (roomUserCountExceedsLimit) throw new ExceedsRoomUserCountError();

            const replacements = {
                user_uuid: user.uuid,
                room_uuid: roomInviteLink.room_uuid,
                role_name: 'Member'
            }

            await db.sequelize.query('CALL join_room_proc(:user_uuid, :room_uuid, :role_name, @result)', {
                replacements,
                transaction
            });
        });
    }
}

const service = new RoomInviteLinkService();

export default service;
