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

        const { room_uuid, user, page, limit } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return super.findAll({ page, limit, override: {
            match: [
                'MATCH (ru:RoomUser)-[:HAS_USER]->(u:User)',
                'MATCH (ru)-[:HAS_ROLE]->(rur:RoomUserRole)',
                'MATCH (ru)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid})'
            ],
            return: ['ru', 'rur', 'u', 'r'],
            map: { model: 'ru', relationships: [
                { alias: 'r', to: 'room' },
                { alias: 'u', to: 'user' },
                { alias: 'rur', to: 'room_user_role' }
            ]},
            params: { room_uuid }
        }}); 
    }

    async update(options = { uuid: null, body: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.body.room_user_role_name) throw new ControllerError(400, 'No room_user_role_name provided');

        const { uuid, body, user } = options;
        const { room_user_role_name } = body;

        const newRoleInstance = await neodeInstance.model('RoomUserRole').find(room_user_role_name);
        if (!newRoleInstance) throw new ControllerError(404, 'Room user role not found');

        const roomUserInstance = await neodeInstance.model('RoomUser').find(uuid);
        if (!roomUserInstance) throw new ControllerError(404, 'Room user not found');

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
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');

        const { uuid, user } = options;
        
        const roomUserInstance = await neodeInstance.model('RoomUser').find(uuid);
        if (!roomUserInstance) throw new ControllerError(404, 'Room user not found');

        const room = roomUserInstance.get('room').endNode().properties();
        if (!room) throw new ControllerError(500, 'Room not found');

        if (!(await RoomPermissionService.isInRoom({ room_uuid: room.uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        await roomUserInstance.delete();
    }
}

const service = new Service();

export default service;
