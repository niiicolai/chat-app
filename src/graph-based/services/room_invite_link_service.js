import ControllerError from '../../shared/errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import ChannelService from './channel_service.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/room_invite_link_dto.js';
import { v4 as uuidv4 } from 'uuid';
import neo4j from 'neo4j-driver';

class Service {
    async findOne(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'findOne: No options provided');
        if (!options.uuid) throw new ControllerError(400, 'findOne: No options.uuid provided');
        if (!options.user) throw new ControllerError(500, 'findOne: No options.user provided');
        if (!options.user.sub) throw new ControllerError(500, 'findOne: No options.user.sub provided');

        const { user, uuid } = options;

        const linkInstance = await neodeInstance.model('RoomInviteLink').find(uuid);
        if (!linkInstance) throw new ControllerError(404, 'Room Invite Link not found');

        const roomInstance = await linkInstance.get('room').endNode().properties();
        if (!roomInstance) throw new ControllerError(404, 'Room not found');

        if (!(await RoomPermissionService.isInRoom({ room_uuid: roomInstance.uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return dto(linkInstance.properties(), [{ room: roomInstance }]);
    }

    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        if (!options) throw new ControllerError(500, 'findAll: No options provided');
        if (!options.room_uuid) throw new ControllerError(400, 'findAll: No options.room_uuid provided');
        if (!options.user) throw new ControllerError(500, 'findAll: No options.user provided');
        if (!options.user.sub) throw new ControllerError(500, 'findAll: No options.user.sub provided');

        const { room_uuid, user } = options;
        let { page, limit } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        if (page && isNaN(page)) throw new ControllerError(400, 'page must be a number');
        if (page && page < 1) throw new ControllerError(400, 'page must be greater than 0');
        if (limit && limit < 1) throw new ControllerError(400, 'limit must be greater than 0');
        if (limit && isNaN(limit)) throw new ControllerError(400, 'limit must be a number');
        if (page && !limit) throw new ControllerError(400, 'page requires limit');
        if (page) page = parseInt(page);
        if (limit) limit = parseInt(limit);

        const props = { room_uuid };
        let cypher = 
            `MATCH (ril:RoomInviteLink)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid})
             ORDER BY ril.created_at DESC`

        if (page && limit) {
            cypher += ' SKIP $skip LIMIT $limit';
            props.skip = neo4j.int((page - 1) * limit);
            props.limit = neo4j.int(limit);
        }

        if (!page && limit) {
            cypher += ' LIMIT $limit';
            props.limit = neo4j.int(limit);
        }

        cypher += ` RETURN ril`;
        
        const dbResult = await neodeInstance.cypher(cypher, props);
        const data = dbResult.records.map((record) => dto(record.get('ril').properties));
        const count = await neodeInstance.cypher(
            `MATCH (ril:RoomInviteLink)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid})
             RETURN COUNT(ril) AS count`,
            { room_uuid }
        );
        const total = count.records[0].get('count').low;
        const result = { data, total };
        if (page) {
            result.page = page;
            result.pages = Math.ceil(total / limit);
        }

        if (limit) result.limit = limit;

        return result;
    }

    async create(options = { body: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');
        if (!options.body.uuid) throw new ControllerError(400, 'No UUID provided');
        if (!options.body.room_uuid) throw new ControllerError(400, 'No room_uuid provided');

        const { body, user } = options;
        const { uuid, room_uuid, expires_at } = body;

        if (expires_at && new Date(expires_at) < new Date()) {
            throw new ControllerError(400, 'The expiration date cannot be in the past');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        const roomInstance = await neodeInstance.model('Room').find(room_uuid);
        if (!roomInstance) throw new ControllerError(404, 'Room not found');
        
        const linkInstance = await neodeInstance.model('RoomInviteLink').create({
            uuid,
            expires_at: expires_at || null,
            created_at: new Date(),
            updated_at: new Date(),
        });

        await linkInstance.relateTo(roomInstance, 'room');
        
        return dto(linkInstance.properties());
    }

    async update(options = { uuid: null, body: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');

        const { uuid, body, user } = options;
        const { expires_at } = body;

        const linkInstance = await neodeInstance.model('RoomInviteLink').find(uuid);
        if (!linkInstance) throw new ControllerError(404, 'Room Invite Link not found');

        linkInstance.update({
            expires_at: expires_at || null,
            updated_at: new Date(),
        });

        return this.findOne({ uuid, user });
    }

    async destroy(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');

        const { uuid, user } = options;

        const linkInstance = await neodeInstance.model('RoomInviteLink').find(uuid);
        if (!linkInstance) throw new ControllerError(404, 'Room Invite Link not found');

        const room = await linkInstance.get('room').endNode().properties();
        const room_uuid = room.uuid;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        await linkInstance.delete();
    }

    async join(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');

        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        const linkInstance = await neodeInstance.model('RoomInviteLink').find(uuid);
        if (!linkInstance) throw new ControllerError(404, 'Room Invite Link not found');
        const link = linkInstance.properties();

        const room = linkInstance.get('room').endNode().properties();
        const roomInstance = await neodeInstance.model('Room').find(room.uuid);

        if (!(await RoomPermissionService.isVerified({ user }))) {
            throw new ControllerError(403, 'You must verify your email before you can join a room');
        }

        if (link.expires_at && new Date(link.expires_at) < new Date()) {
            throw new ControllerError(400, 'Room Invite Link has expired');
        }

        if (await RoomPermissionService.isInRoom({ room_uuid: room.uuid, user, role_name: null })) {
            throw new ControllerError(400, 'User is already in room');
        }

        if (await RoomPermissionService.roomUserCountExceedsLimit({ room_uuid: room.uuid, add_count: 1 })) {
            throw new ControllerError(400, 'Room user count exceeds limit. The room cannot have more users');
        }

        const roomUserRole = await neodeInstance.model('RoomUserRole').find('Member');
        if (!roomUserRole) throw new ControllerError(500, 'RoomUserRole not found');

        const userInstance = await neodeInstance.model('User').find(user_uuid);
        if (!userInstance) throw new ControllerError(404, 'User not found');

        const session = neodeInstance.session();
        session.writeTransaction(async (transaction) => {
            await transaction.run(
                `MATCH (u:User {uuid: $user_uuid})
                 MATCH (r:Room {uuid: $room_uuid})
                 MATCH (rur:RoomUserRole {name: 'Member'})
                 CREATE (ru:RoomUser {uuid: $room_user_uuid})
                 CREATE (ru)-[:HAS_USER]->(u)
                 CREATE (ru)-[:HAS_ROOM]->(r)
                 CREATE (ru)-[:HAS_ROLE]->(rur)
                `,
                { user_uuid, room_uuid: room.uuid, room_user_uuid: uuidv4() }
            );
        });
        
        const roomJoinSettings = roomInstance.get('room_join_settings').endNode().properties();
        const roomJoinSettingsInstance = await neodeInstance.model('RoomJoinSettings').find(roomJoinSettings.uuid);

        let channelId = roomJoinSettingsInstance.get('join_channel')?.endNode()?.properties()?.uuid;
        if (!channelId) {
            const channelResult = await ChannelService.findAll({ room_uuid: room.uuid, user });
            if (channelResult.data.length > 0) {
                channelId = channelResult.data[0].uuid;
            }
        }

        if (channelId) {
            const username = userInstance.properties().username;
            const joinMessage = roomJoinSettings.join_message;
            const body = joinMessage.includes('{name}') 
                ? joinMessage.replace('{name}', username) 
                : joinMessage;

            const session = neodeInstance.session();
            session.writeTransaction(async (transaction) => {
                await transaction.run(
                    `MATCH (u:User {uuid: $user_uuid})
                     MATCH (c:Channel {uuid: $channel_uuid})
                     MATCH (cmt:ChannelMessageType {name: 'System'})
                     CREATE (cm:ChannelMessage {uuid: $channel_message_uuid, body: $body})
                     CREATE (cm)-[:HAS_CHANNEL_MESSAGE_TYPE]->(cmt)
                     CREATE (cm)-[:HAS_CHANNEL]->(c)
                     CREATE (cm)-[:HAS_USER]->(u)
                    `,
                    { user_uuid, channel_uuid: channelId, channel_message_uuid: uuidv4(), body }
                );
            });
        }
    }
}

const service = new Service();

export default service;
