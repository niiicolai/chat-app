import TypeServiceValidator from '../../shared/validators/type_service_validator.js';
import err from '../../shared/errors/index.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/type_dto.js';

/**
 * @function _dto
 * @description DTO function for user status states.
 * @param {Object} type
 * @returns {Object}
 */
const _dto = (type) => dto(type, 'user_status_state_');

/**
 * @class UserStatusStateService
 * @description Service class for user status states.
 * @exports UserStatusStateService
 */
class UserStatusStateService {

    /**
     * @function findOne
     * @description Find a user status state by name.
     * @param {Object} options
     * @param {string} options.name
     * @returns {Promise<Object>}
     */
    async findOne(options = { name: null }) {
        TypeServiceValidator.findOne(options);

        const type = await db.UserStatusStateView.findByPk(options.name);
        if (!type) throw new err.EntityNotFoundError('user_status_state');

        return _dto(type);
    }

    /**
     * @function findAll
     * @description Find all user status states.
     * @param {Object} options
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { page: null, limit: null }) {
        options = TypeServiceValidator.findAll(options);

        const { page, limit, offset } = options;
        const [total, data] = await Promise.all([
            db.UserStatusStateView.count(),
            db.UserStatusStateView.findAll({
                ...(limit && { limit }),
                ...(offset && { offset }),
                order: [['user_status_state_created_at', 'DESC']]
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

const service = new UserStatusStateService();

export default service;
