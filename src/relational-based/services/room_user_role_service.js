import TypeServiceValidator from '../../shared/validators/type_service_validator.js';
import err from '../../shared/errors/index.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/type_dto.js';

/**
 * @function _dto
 * @description DTO function for room user roles.
 * @param {Object} type
 * @returns {Object}
 */
const _dto = (type) => dto(type, 'room_user_role_');

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
        TypeServiceValidator.findOne(options);

        const type = await db.RoomUserRoleView.findByPk(options.name);
        if (!type) throw new err.EntityNotFoundError('room_user_role');

        return _dto(type);
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
        options = TypeServiceValidator.findAll(options);

        const { page, limit, offset } = options;
        const [total, data] = await Promise.all([
            db.RoomUserRoleView.count(),
            db.RoomUserRoleView.findAll({
                ...(limit && { limit }),
                ...(offset && { offset })
            })
        ]);
        
        return {
            total,
            data: data.map(type => _dto(type)),
            ...(limit && { limit }),
            ...(page && { page }),
            ...(page && { pages: Math.ceil(total / limit) })
        };
    }
}

const service = new RoomUserRoleService();

export default service;
