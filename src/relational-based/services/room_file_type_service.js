import TypeServiceValidator from '../../shared/validators/type_service_validator.js';
import EntityNotFoundError from '../../shared/errors/entity_not_found_error.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/type_dto.js';

/**
 * @function _dto
 * @description DTO function for room categories.
 * @param {Object} type
 * @returns {Object}
 */
const _dto = (type) => dto(type, 'room_file_type_');

/**
 * @class RoomFileTypeService
 * @description Service class for room file types.
 * @exports RoomFileTypeService
 */
class RoomFileTypeService {

    /**
     * @function findOne
     * @description Find a room file type by name.
     * @param {Object} options
     * @param {string} options.name
     * @returns {Promise<Object>}
     */
    async findOne(options = { name: null }) {
        TypeServiceValidator.findOne(options);

        const type = await db.RoomFileTypeView.findByPk(options.name);
        if (!type) throw new EntityNotFoundError('room_file_type');

        return _dto(type);
    }

    /**
     * @function findAll
     * @description Find all room file types.
     * @param {Object} options
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { page: null, limit: null }) {
        options = TypeServiceValidator.findAll(options);

        const { page, limit, offset } = options;
        const [total, data] = await Promise.all([
            db.RoomFileTypeView.count(),
            db.RoomFileTypeView.findAll({
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

const service = new RoomFileTypeService();

export default service;
