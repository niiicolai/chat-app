import Validator from '../../shared/validators/room_invite_link_service_validator.js';
import err from '../../shared/errors/index.js';
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
        Validator.findOne(options);

        const { uuid, user } = options;
        const entity = await db.RoomInviteLinkView.findByPk(uuid);
        if (!entity) throw new err.EntityNotFoundError('room_invite_link');

        const isInRoom = await RPS.isInRoom({ room_uuid: entity.room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

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
        options = Validator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        const room = await db.RoomView.findOne({ uuid: room_uuid });
        if (!room) throw new err.EntityNotFoundError('room');

        const isInRoom = await RPS.isInRoom({ room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const [total, data] = await Promise.all([
            db.RoomInviteLinkView.count({ where: { room_uuid } }),
            db.RoomInviteLinkView.findAll({
                where: { room_uuid },
                ...(limit && { limit }),
                ...(offset && { offset }),
                order: [['room_invite_link_created_at', 'DESC']]
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
        Validator.create(options);

        const { body, user } = options;
        const { room_uuid, expires_at } = body;

        const room = await db.RoomView.findByPk(room_uuid);
        if (!room) throw new err.EntityNotFoundError('room');

        const isAdmin = await RPS.isInRoom({ room_uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        await db.RoomInviteLinkView.createRoomInviteLinkProcStatic({
            uuid: body.uuid,
            room_uuid,
            expires_at: expires_at
                ? new Date(expires_at).toISOString().slice(0, 19).replace('T', ' ') // YYYY-MM-DD HH:MM:SS
                : null
        }).catch((error) => {
            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new err.DuplicateEntryError('room_invite_link', error.errors[0].path, error.errors[0].value);
            } else if (error.name === 'SequelizeForeignKeyConstraintError') {
                throw new err.EntityNotFoundError(error.fields[0]);
            }

            throw error;
        });

        return await db.RoomInviteLinkView
            .findByPk(body.uuid)
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
        Validator.update(options);

        const { uuid, body, user } = options;

        const roomInviteLink = await db.RoomInviteLinkView.findByPk(uuid);
        if (!roomInviteLink) throw new err.EntityNotFoundError('room_invite_link');

        const isAdmin = await RPS.isInRoom({ room_uuid: roomInviteLink.room_uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const expires_at = Object.keys(body).includes('expires_at') 
            ? body.expires_at ? new Date(body.expires_at).toISOString().slice(0, 19).replace('T', ' ') : null 
            : roomInviteLink.expires_at || null;

        await roomInviteLink.editRoomInviteLinkProc({
            expires_at
        });

        return await db.RoomInviteLinkView
            .findByPk(uuid)
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
        Validator.destroy(options);

        const { uuid, user } = options;

        const roomInviteLink = await db.RoomInviteLinkView.findByPk(uuid);
        if (!roomInviteLink) throw new err.EntityNotFoundError('room_invite_link');

        const isAdmin = await RPS.isInRoom({ room_uuid: roomInviteLink.room_uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        await roomInviteLink.deleteRoomInviteLinkProc();
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
        Validator.join(options);

        const { uuid, user } = options;

        await db.sequelize.transaction(async (transaction) => {
            const roomInviteLink = await db.RoomInviteLinkView.findOne(
                { where: { room_invite_link_uuid: uuid }, transaction }
            );
            if (!roomInviteLink) throw new err.EntityNotFoundError('room_invite_link');

            if (roomInviteLink.expires_at && new Date(roomInviteLink.expires_at) < new Date()) {
                throw new err.EntityExpiredError('room_invite_link');
            }

            await Promise.all([
                RPS.isInRoom({ room_uuid: roomInviteLink.room_uuid, user, role_name: null }, transaction),
                RPS.isVerified({ user }, transaction),
                RPS.roomUserCountExceedsLimit({ room_uuid: roomInviteLink.room_uuid, add_count: 1 }, transaction)
            ]).then(([isInRoom, isUserEmailVerified, roomUserCountExceedsLimit]) => {
                if (isInRoom) throw new err.DuplicateRoomUserError();
                if (!isUserEmailVerified) throw new err.VerifiedEmailRequiredError('join a room');
                if (roomUserCountExceedsLimit) throw new err.ExceedsRoomUserCountError();
            });

            await db.RoomView.joinRoomProcStatic({
                user_uuid: user.sub,
                room_uuid: roomInviteLink.room_uuid,
                role_name: 'Member'
            }, transaction);
        });
    }
}

const service = new RoomInviteLinkService();

export default service;
