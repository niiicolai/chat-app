import RoomUserServiceValidator from '../../shared/validators/room_user_service_validator.js';
import ControllerError from '../../shared/errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/room_user_dto.js';
import NeodeBaseFindService from './neode_base_find_service.js';
import neodeInstance from '../neode/index.js';
import neo4j from 'neo4j-driver';

/**
 * @class RoomUserService
 * @description Service class for room users
 * @exports RoomUserService
 */
class RoomUserService extends NeodeBaseFindService {
    constructor() {
        super('uuid', 'RoomUser', dto);
    }

    async findOne(options = { uuid: null, user: null }) {
        RoomUserServiceValidator.findOne(options);

        const roomUser = await neodeInstance.model('RoomUser').find(options.uuid);
        if (!roomUser) throw new ControllerError(404, 'room_user not found');

        const room = roomUser.get('room').endNode().properties();
        const user = roomUser.get('user').endNode().properties();
        const role = roomUser.get('room_user_role').endNode().properties();
        
        if (!(await RoomPermissionService.isInRoom({ room_uuid: room.uuid, user: options.user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return dto({ ...roomUser.properties(), room, user, role });
    }

    async findAuthenticatedUser(options = { room_uuid: null, user: null }) {
        RoomUserServiceValidator.findAuthenticatedUser(options);

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
        if (!roomUser) throw new ControllerError(500, 'room_user not found');

        const role = roomUserInstance.records[0].get('rur').properties;
        if (!role) throw new ControllerError(500, 'Room user role not found');

        return dto({
            ...roomUser,
            room: roomInstance.properties(),
            user: userInstance.properties(),
            role,
        });
    }

    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = RoomUserServiceValidator.findAll(options);

        const { room_uuid, user, page, limit, offset } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const result = await neodeInstance.batch([
            { query:
                `MATCH (r:Room {uuid: $room_uuid}) ` +
                `MATCH (ru:RoomUser)-[:HAS_ROOM]->(r) ` +
                `MATCH (ru)-[:HAS_USER]->(u:User) ` +
                `MATCH (ru)-[:HAS_ROLE]->(rur:RoomUserRole) ` +
                `ORDER BY ru.created_at DESC ` +
                (offset ? `SKIP $offset `:``) + (limit ? `LIMIT $limit ` : ``) +
                `RETURN ru, rur, u`,
              params: {
                room_uuid,
                ...(offset && { offset: neo4j.int(offset) }),
                ...(limit && { limit: neo4j.int(limit) }),
              }
            }, 
            { query: 
                `MATCH (r:Room {uuid: $room_uuid}) ` +
                `MATCH (ru:RoomUser)-[:HAS_ROOM]->(r) ` +
                `RETURN COUNT(ru) AS count`, 
              params: {
                room_uuid,
              }
            },
        ]);
        const total = result[1].records[0].get('count').low;
        return {
            total, 
            data: result[0].records.map(record => dto({
                ...record.get('ru').properties,
                room: { uuid: room_uuid },
                user: record.get('u').properties,
                role: record.get('rur').properties
            })),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }

    async update(options = { uuid: null, body: null, user: null }) {
        RoomUserServiceValidator.update(options);

        const { uuid, body, user } = options;
        const { room_user_role_name } = body;

        const roomUserInstance = await neodeInstance.model('RoomUser').find(uuid);
        if (!roomUserInstance) throw new ControllerError(404, 'room_user not found');

        const newRoleInstance = await neodeInstance.model('RoomUserRole').find(room_user_role_name);
        if (!newRoleInstance) throw new ControllerError(404, 'Room user role not found');

        const room = roomUserInstance.get('room').endNode().properties();
        if (!room) throw new ControllerError(500, 'Room not found');

        if (!(await RoomPermissionService.isInRoom({ room_uuid: room.uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        const oldRole = roomUserInstance.get('room_user_role').endNode().properties();
        if (!oldRole) throw new ControllerError(500, 'Room user role not found');
        const oldRoleInstance = await neodeInstance.model('RoomUserRole').find(oldRole.name);
        await roomUserInstance.detachFrom(oldRoleInstance);
        await roomUserInstance.relateTo(newRoleInstance, 'room_user_role');
    }

    async destroy(options = { uuid: null, user: null }) {
        RoomUserServiceValidator.destroy(options);

        const { uuid, user } = options;
        
        const roomUserInstance = await neodeInstance.model('RoomUser').find(uuid);
        if (!roomUserInstance) throw new ControllerError(404, 'room_user not found');

        const room = roomUserInstance.get('room').endNode().properties();
        if (!room) throw new ControllerError(500, 'Room not found');

        if (!(await RoomPermissionService.isInRoom({ room_uuid: room.uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        await roomUserInstance.delete();
    }
}

const service = new RoomUserService();

export default service;
