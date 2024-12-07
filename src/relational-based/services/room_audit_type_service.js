import TypeServiceValidator from '../../shared/validators/type_service_validator.js';
import err from '../../shared/errors/index.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/type_dto.js';

/**
 * @function _dto
 * @description DTO function for room audit types.
 * @param {Object} type
 * @returns {Object}
 */
const _dto = (type) => dto(type, 'room_audit_type_');

/**
 * @class RoomAuditTypeService
 * @description Service class for room audit types.
 * @exports RoomAuditTypeService
 */
class RoomAuditTypeService {

    /**
     * @function findOne
     * @description Find a room audit type by name.
     * @param {Object} options
     * @param {string} options.name
     * @returns {Promise<Object>}
     */
    async findOne(options = { name: null }) {
        TypeServiceValidator.findOne(options);

        const type = await db.RoomAuditTypeView.findByPk(options.name);
        if (!type) throw new err.EntityNotFoundError('room_audit_type');

        return _dto(type);
    }

    /**
     * @function findAll
     * @description Find all room audit types.
     * @param {Object} options
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { page: null, limit: null }) {
        options = TypeServiceValidator.findAll(options);

        const { page, limit, offset } = options;
        const [total, data] = await Promise.all([
            db.RoomAuditTypeView.count(),
            db.RoomAuditTypeView.findAll({
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

const service = new RoomAuditTypeService();

export default service;
