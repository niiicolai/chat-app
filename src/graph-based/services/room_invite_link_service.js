import Validator from '../../shared/validators/room_invite_link_service_validator.js';
import { getJoinMessage } from '../../shared/utils/join_message_utils.js';
import err from '../../shared/errors/index.js';
import RPS from './room_permission_service.js';
import ChannelService from './channel_service.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/room_invite_link_dto.js';
import neo4j from 'neo4j-driver';
import { v4 as uuidv4 } from 'uuid';

/**
 * @class RoomInviteLinkService
 * @description Service class for room invite links
 * @exports RoomInviteLinkService
 */
class RoomInviteLinkService {

    /**
     * @function findOne
     * @description Find a room invite link by uuid
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.user
     * @param {Object} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const { user, uuid } = options;

        const link = await neodeInstance.model('RoomInviteLink').find(uuid);
        if (!link) throw new err.EntityNotFoundError('room_invite_link');

        const room = await link.get('room').startNode().properties();

        const isInRoom = await RPS.isInRoom({ room_uuid: room.uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto({ ...link.properties(), room });
    }

    /**
     * @function findAll
     * @description Find all room invite links
     * @param {Object} options
     * @param {string} options.room_uuid
     * @param {Object} options.user
     * @param {Object} options.user.sub
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = Validator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        const isInRoom = await RPS.isInRoom({ room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const result = await neodeInstance.cypher(
            `MATCH (r:Room {uuid: $room_uuid}) ` +
            `MATCH (r)-[:INVITES_VIA]->(ril:RoomInviteLink) ` +
            `ORDER BY ril.created_at DESC ` +
            (offset ? `SKIP $offset ` : ``) +
            (limit ? `LIMIT $limit ` : ``) +
            `RETURN COUNT(ril) AS total, ril, r`,
            {
                ...(offset && { offset: neo4j.int(offset) }),
                ...(limit && { limit: neo4j.int(limit) }),
                room_uuid
            }
        );
        
        const total = result.records.length > 0 
            ? result.records[0].get('total').low
            : 0;
            
        return {
            total,
            data: result.records.map(record => dto({
                ...record.get('ril').properties,
                room: record.get('r').properties,
            })),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }

    /**
     * @function create
     * @description Create a room invite link
     * @param {Object} options
     * @param {Object} options.body
     * @param {string} options.body.uuid
     * @param {string} options.body.room_uuid
     * @param {string} options.body.expires_at
     * @param {Object} options.user
     * @param {Object} options.user.sub
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, user: null }) {
        Validator.create(options);

        const { body, user } = options;
        const { uuid, room_uuid, expires_at } = body;

        const room = await neodeInstance.model('Room').find(room_uuid);
        if (!room) throw new err.EntityNotFoundError('room');

        const isAdmin = await RPS.isInRoom({ room_uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const uuidUsed = await neodeInstance.model('RoomInviteLink').find(uuid);
        if (uuidUsed) throw new err.DuplicateEntryError('room_invite_link', 'PRIMARY', uuid);

        try {
            await neodeInstance.batch([{
                query:
                    `MATCH (r:Room {uuid: $room_uuid}) ` +
                    `CREATE (ril:RoomInviteLink {uuid: $uuid, expires_at: $expires_at, created_at: datetime(), updated_at: datetime()}) ` +
                    `CREATE (r)-[:INVITES_VIA]->(ril)`,
                params: { uuid, room_uuid, expires_at: expires_at || null }
            }]);
        } catch (e) {
            console.error(e);
            throw e;
        }

        return await this.findOne({ uuid, user });
    }

    /**
     * @function update
     * @description Update a room invite link
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.body
     * @param {string} options.body.expires_at
     * @param {Object} options.user
     * @param {Object} options.user.sub
     * @returns {Promise<Object>}
     */
    async update(options = { uuid: null, body: null, user: null }) {
        Validator.update(options);

        const { uuid, body, user } = options;
        const { expires_at } = body;

        const link = await neodeInstance.model('RoomInviteLink').find(uuid);
        if (!link) throw new err.EntityNotFoundError('room_invite_link');

        const room = await link.get('room').startNode().properties();
        const room_uuid = room.uuid;
        const isAdmin = await RPS.isInRoom({ room_uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        await link.update({ expires_at: expires_at || null });
        return await this.findOne({ uuid, user });
    }

    /**
     * @function destroy
     * @description Destroy a room invite link
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.user
     * @param {Object} options.user.sub
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null, user: null }) {
        Validator.destroy(options);

        const { uuid, user } = options;

        const link = await neodeInstance.model('RoomInviteLink').find(uuid);
        if (!link) throw new err.EntityNotFoundError('room_invite_link');

        const room = await link.get('room').startNode().properties();
        const room_uuid = room.uuid;
        const isAdmin = await RPS.isInRoom({ room_uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        await link.delete();
    }

    /**
     * @function join
     * @description Join a room using a room invite link
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.user
     * @param {Object} options.user.sub
     * @returns {Promise<void>}
     */
    async join(options = { uuid: null, user: null }) {
        Validator.join(options);

        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        const isVerified = await RPS.isVerified({ user });
        if (!isVerified) err.VerifiedEmailRequiredError("join a room");

        const link = await neodeInstance.model('RoomInviteLink').find(uuid);
        if (!link) throw new err.EntityNotFoundError('room_invite_link');

        const { expires_at } = link.properties();
        const room = link.get('room').startNode().properties();
        const room_uuid = room.uuid;

        const isInRoom = await RPS.isInRoom({ room_uuid, user });
        if (isInRoom) throw new err.DuplicateRoomUserError();
        
        if (expires_at && new Date(expires_at) < new Date()) {
            throw new err.EntityExpiredError('room_invite_link');
        }

        const exceedsCount = await RPS.roomUserCountExceedsLimit({ room_uuid, add_count: 1 });
        if (exceedsCount) throw new err.ExceedsRoomUserCountError();

        const session = neodeInstance.session();
        await session.writeTransaction(async tx => {
            // Add the user to the room
            await tx.run(
                `MATCH (u:User {uuid: $user_uuid}) ` +
                `MATCH (r:Room {uuid: $room_uuid}) ` +
                `CREATE (u)-[:MEMBER_IN {uuid: $mui_uuid, role: "Member", created_at: datetime(), updated_at: datetime()}]->(r) `,
                { user_uuid, room_uuid, mui_uuid: uuidv4() }
            );

            // Find the room's join settings
            const result = await tx.run(
                `MATCH (r:Room {uuid: $room_uuid}) ` +
                `MATCH (r)-[:JOIN_SETTINGS_IS]->(rjs:RoomJoinSettings) ` +
                `OPTIONAL MATCH (rjs)-[:ANNOUNCE_IN]->(rjsc:Channel) ` +
                `OPTIONAL MATCH (r)-[:COMMUNICATES_IN]->(c:Channel) ` +
                `RETURN rjs, rjsc.uuid AS join_channel_uuid, c.uuid AS channel_uuid`,
                { room_uuid }
            );
            if (result.records.length > 0) {
                const roomJoinSettings = result.records[0].get('rjs').properties;
                const message = roomJoinSettings.join_message;
                let join_channel_uuid = result.records[0].get('join_channel_uuid');
                if (!join_channel_uuid && result.records[0].get('channel_uuid')) {
                    join_channel_uuid = result.records[0].get('channel_uuid');
                }

                // Announce the user's join
                if (join_channel_uuid) {
                    await tx.run(
                        `MATCH (u:User {uuid: $user_uuid})
                         MATCH (c:Channel {uuid: $channel_uuid})
                         MATCH (cmt:ChannelMessageType {name: 'System'})
                         CREATE (cm:ChannelMessage {uuid: $channel_message_uuid, body: $message, created_at: datetime(), updated_at: datetime()})
                         CREATE (cm)-[:TYPE_IS]->(cmt)
                         CREATE (cm)-[:WRITTEN_IN]->(c)
                         CREATE (cm)-[:WRITTEN_BY]->(u)
                        `,
                        { user_uuid, channel_uuid: join_channel_uuid, channel_message_uuid: uuidv4(), message }
                    );
                }
            }
        }).catch(error => {
            // Delete the avatar file if it was uploaded
            if (room_file_src) storage.deleteFile(storage.parseKey(room_file_src));

            console.error('transaction', error);
            throw error;
        }).finally(() => {
            session.close();
        });
    }
}

const service = new RoomInviteLinkService();

export default service;
