import Validator from '../../shared/validators/type_service_validator.js';
import err from '../../shared/errors/index.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/type_dto.js';
import neo4j from 'neo4j-driver';

/**
 * @class RoomUserRoleService
 * @description Service class for room user roles.
 * @exports RoomUserRoleService
 */
class RoomUserRoleService {

    /**
     * @function findOne
     * @description Find a room user role by name.
     * @param {Object} options
     * @param {string} options.name
     * @returns {Promise<Object>}
     */
    async findOne(options = { name: null }) {
        Validator.findOne(options);

        const result = await neodeInstance.model('RoomUserRole').find(options.name);
        if (!result) throw new err.EntityNotFoundError('room_user_role');

        return dto(result.properties());
    }

    /**
     * @function findAll
     * @description Find all room user roles.
     * @param {Object} options
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { page: null, limit: null }) {
        options = Validator.findAll(options);

        const { page, limit, offset } = options;
        const result = await neodeInstance.batch([
            { query:
                `MATCH (uss:RoomUserRole) ORDER BY uss.created_at DESC ` +
                (offset ? `SKIP $offset `:``) + (limit ? `LIMIT $limit ` : ``) +
                `RETURN uss`,
              params: {
                ...(offset && { offset: neo4j.int(offset) }),
                ...(limit && { limit: neo4j.int(limit) }),
              }
            }, 
            { query: `MATCH (uss:RoomUserRole) RETURN COUNT(uss) AS count`, params: {} },
        ]);
        const total = result[1].records[0].get('count').low;
        return {
            total, 
            data: result[0].records.map(record => dto(record.get('uss').properties)),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }
}

const service = new RoomUserRoleService();

export default service;
