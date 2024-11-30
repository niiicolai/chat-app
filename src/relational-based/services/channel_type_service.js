import TypeServiceValidator from '../../shared/validators/type_service_validator.js';
import EntityNotFoundError from '../../shared/errors/entity_not_found_error.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/type_dto.js';

/**
 * @function _dto
 * @description DTO function for channel types.
 * @param {Object} type
 * @returns {Object}
 */
const _dto = (type) => dto(type, 'channel_type_');

/**
 * @class ChannelTypeService
 * @description Service class for channel types.
 * @exports ChannelTypeService
 */
class ChannelTypeService {

    /**
     * @function findOne
     * @description Find a channel type by name.
     * @param {Object} options
     * @param {string} options.name
     * @returns {Promise<Object>}
     */
    async findOne(options = { name: null }) {
        TypeServiceValidator.findOne(options);

        const type = await db.ChannelTypeView.findByPk(options.name);
        if (!type) throw new EntityNotFoundError('channel_type');

        return _dto(type);
    }

    /**
     * @function findAll
     * @description Find all channel types.
     * @param {Object} options
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { page: null, limit: null }) {
        options = TypeServiceValidator.findAll(options);

        const { page, limit, offset } = options;
        const [total, data] = await Promise.all([
            db.ChannelTypeView.count(),
            db.ChannelTypeView.findAll({
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

const service = new ChannelTypeService();

export default service;
