import Validator from '../../shared/validators/room_user_service_validator.js';
import err from '../../shared/errors/index.js';
import RPS from './room_permission_service.js';
import dto from '../dto/room_user_dto.js';
import neodeInstance from '../neode/index.js';
import neo4j from 'neo4j-driver';

/**
 * @class RoomUserService
 * @description Service class for room users
 * @exports RoomUserService
 */
class RoomUserService {

    /**
     * @function findOne
     * @description Find a room user by uuid
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.user
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const { uuid } = options;
        const result = await neodeInstance.cypher(
            `MATCH (r:Room)<-[ru:MEMBER_IN {uuid: $uuid}]-(u:User) ` +
            `RETURN r, u, ru`,
            { uuid }
        );

        if (!result.records.length) throw new err.EntityNotFoundError('room_user');

        const room = result.records[0].get('r').properties;
        const user = result.records[0].get('u').properties;

        const isInRoom = await RPS.isInRoom({ room_uuid: room.uuid, user: options.user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto({ ...result.records[0].get('ru').properties, room, user });
    }

    /**
     * @function findAuthenticatedUser
     * @description Find the authenticated user in a room
     * @param {Object} options
     * @param {string} options.room_uuid
     * @param {Object} options.user
     * @param {string} options.user.sub
     * @returns {Promise<Object>}
     */
    async findAuthenticatedUser(options = { room_uuid: null, user: null }) {
        Validator.findAuthenticatedUser(options);

        const { room_uuid, user } = options;
        const { sub: user_uuid } = user;

        const isInRoom = await RPS.isInRoom({ room_uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const result = await neodeInstance.cypher(
            `MATCH (r:Room {uuid: $room_uuid})<-[ru:MEMBER_IN]-(u:User {uuid: $user_uuid}) ` +
            `RETURN r, u, ru`,
            { room_uuid, user_uuid }
        );

        return dto({
            ...result.records[0].get('ru').properties,
            room: result.records[0].get('r').properties,
            user: result.records[0].get('u').properties,
        });
    }

    /**
     * @function findAll
     * @description Find all room users
     * @param {Object} options
     * @param {string} options.room_uuid
     * @param {Object} options.user
     * @param {string} options.user.sub
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
            `MATCH (r:Room {uuid: $room_uuid})<-[ru:MEMBER_IN]-(u:User) ` +
            `ORDER BY ru.created_at DESC ` +
            (offset ? `SKIP $offset ` : ``) +
            (limit ? `LIMIT $limit ` : ``) +
            `RETURN r, u, ru, COUNT(u) AS total`,
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
                ...record.get('ru').properties,
                room: record.get('r').properties,
                user: record.get('u').properties,
            })),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }

    /**
     * @function update
     * @description Update a room user
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.body
     * @param {string} options.body.room_user_role_name
     * @param {Object} options.user
     * @param {string} options.user.sub
     * @returns {Promise<void>}
     */
    async update(options = { uuid: null, body: null, user: null }) {
        Validator.update(options);

        const { uuid, body, user } = options;
        const { room_user_role_name } = body;

        const result = await neodeInstance.cypher(
            `MATCH (r:Room)<-[ru:MEMBER_IN {uuid: $uuid}]-(u:User) ` +
            `RETURN r, u, ru`,
            { uuid }
        );
        if (!result.records.length) throw new err.EntityNotFoundError('room_user');

        const room = result.records[0].get('r').properties;
        const room_uuid = room.uuid;
        const isAdmin = await RPS.isInRoom({ room_uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const role = await neodeInstance.model('RoomUserRole').find(room_user_role_name);
        if (!role) throw new err.EntityNotFoundError('room_user_role');

        try {
            await neodeInstance.batch([{
                query:
                    `MATCH (r:Room)<-[ru:MEMBER_IN {uuid: $uuid}]-(u:User) ` +
                    `SET ru.updated_at = datetime() ` +
                    `SET ru.role = $room_user_role_name `,
                params: { uuid, room_user_role_name }
            }]);
        } catch (e) {
            console.error(JSON.stringify(e));
            throw e;
        }
    }

    /**
     * @function destroy
     * @description Destroy a room user
     * @param {Object} options
     * @param {string} options.uuid
     * @param {Object} options.user
     * @param {string} options.user.sub
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null, user: null }) {
        Validator.destroy(options);

        const { uuid, user } = options;

        const result = await neodeInstance.cypher(
            `MATCH (r:Room)<-[ru:MEMBER_IN {uuid: $uuid}]-(u:User) ` +
            `RETURN r, u, ru`,
            { uuid }
        );

        if (!result.records.length) throw new err.EntityNotFoundError('room_user');

        const room = result.records[0].get('r').properties;
        const room_uuid = room.uuid;
        const isAdmin = await RPS.isInRoom({ room_uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        try {
            await neodeInstance.batch([{
                query:
                    `MATCH (r:Room)<-[ru:MEMBER_IN {uuid: $uuid}]-(u:User) ` +
                    `DELETE ru`,
                params: { uuid }
            }]);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
}

const service = new RoomUserService();

export default service;
