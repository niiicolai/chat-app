import TypeServiceValidator from '../../shared/validators/type_service_validator.js';
import err from '../../shared/errors/index.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/type_dto.js';

/**
 * @function _dto
 * @description DTO function for room categories.
 * @param {Object} type
 * @returns {Object}
 */
const _dto = (type) => dto(type, 'room_category_');

/**
 * @class RoomCategoryService
 * @description Service class for room categories.
 * @exports RoomCategoryService
 */
class RoomCategoryService {

    /**
     * @function findOne
     * @description Find a room category by name.
     * @param {Object} options
     * @param {string} options.name
     * @returns {Promise<Object>}
     */
    async findOne(options = { name: null }) {
        TypeServiceValidator.findOne(options);

        const type = await db.RoomCategoryView.findByPk(options.name);
        if (!type) throw new err.EntityNotFoundError('room_category');

        return _dto(type);
    }

    /**
     * @function findAll
     * @description Find all room categories.
     * @param {Object} options
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { page: null, limit: null }) {
        options = TypeServiceValidator.findAll(options);

        const { page, limit, offset } = options;
        const [total, data] = await Promise.all([
            db.RoomCategoryView.count(),
            db.RoomCategoryView.findAll({
                ...(limit && { limit }),
                ...(offset && { offset }),
                order: [['room_category_created_at', 'DESC']]
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

const service = new RoomCategoryService();

export default service;
