import ControllerError from '../../shared/errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/room_user_dto.js';
import NeodeBaseFindService from './neode_base_find_service.js';
import neodeInstance from '../neode/index.js';
import neo4j from 'neo4j-driver';

class Service extends NeodeBaseFindService {
    constructor() {
        super('uuid', 'RoomUser', dto);
    }

    async findOne(options = { user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');

        const { uuid, user } = options;

        const roomUser = await super.findOne({ uuid, eager: ['room_user_role', 'room'] });
        if (!roomUser) throw new ControllerError(404, 'Room user not found');

        if (!(await RoomPermissionService.isInRoom({ room_uuid: roomUser.room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return roomUser;
    }

    async findAuthenticatedUser(options = { room_uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.room_uuid) throw new ControllerError(400, 'No room_uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');

        const { room_uuid, user } = options;
        const { sub: user_uuid } = user;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const roomInstance = await neodeInstance.model('Room').find(room_uuid);
        if (!roomInstance) throw new ControllerError(404, 'Room not found');

        const userInstance = await neodeInstance.model('User').find(user_uuid);
        if (!userInstance) throw new ControllerError(404, 'User not found');

        const roomUserInstance = await neodeInstance.cypher(
            `MATCH (ru:RoomUser)-[:HAS_USER]->(u:User {uuid: $user_uuid})
             MATCH (ru)-[:HAS_ROLE]->(rur:RoomUserRole)
             MATCH (ru)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid})
             RETURN ru, rur`,
            { user_uuid, room_uuid }
        );

        if (!roomUserInstance.records.length) return null;

        const roomUser = roomUserInstance.records[0].get('ru').properties;
        if (!roomUser) throw new ControllerError(500, 'Room user not found');

        const role = roomUserInstance.records[0].get('rur').properties;
        if (!role) throw new ControllerError(500, 'Room user role not found');

        return this.dto(roomUser, [
            { room: roomInstance.properties() },
            { user: userInstance.properties() },
            { room_user_role: role },
        ]);
    }

    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.room_uuid) throw new ControllerError(400, 'No room_uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');

        const { room_uuid, user } = options;
        let { page, limit } = options;

        if (page && isNaN(page)) throw new ControllerError(400, 'page must be a number');
        if (page && page < 1) throw new ControllerError(400, 'page must be greater than 0');
        if (limit && limit < 1) throw new ControllerError(400, 'limit must be greater than 0');
        if (limit && isNaN(limit)) throw new ControllerError(400, 'limit must be a number');
        if (page && !limit) throw new ControllerError(400, 'page requires limit');
        if (page) page = parseInt(page);
        if (limit) limit = parseInt(limit);

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        let cypher =
            `MATCH (ru:RoomUser)-[:HAS_USER]->(u:User)
             MATCH (ru)-[:HAS_ROLE]->(rur:RoomUserRole)
             MATCH (ru)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid})`;

        const params = { room_uuid };

        if (limit) {
            cypher += ' LIMIT $limit';
            params.limit = neo4j.int(limit);
        }

        if (page && limit) {
            const offset = ((page - 1) * limit);
            cypher += ' SKIP $offset';
            params.offset = neo4j.int(offset);
        }

        cypher += ' RETURN ru, rur, u';

        const dbResult = await neodeInstance.cypher(cypher, params);
        const data = dbResult.records.map((record) => {
            const roomUser = record.get('ru').properties;
            const role = record.get('rur').properties;
            const user = record.get('u').properties;

            return this.dto(roomUser, [
                { room: { uuid: room_uuid } },
                { user },
                { room_user_role: role },
            ]);
        });
        const count = await neodeInstance.cypher(
            `MATCH (ru:RoomUser)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid}) RETURN count(ru)`,
            { room_uuid }
        );
        const total = count.records[0]?.get('count(ru)').low || 0;
        const result = { data, total };

        if (page) {
            result.pages = Math.ceil(total / limit);
            result.page = page;
        }

        if (limit) result.limit = limit;

        return result;
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
