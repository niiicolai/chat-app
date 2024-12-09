import TypeServiceValidator from '../../shared/validators/type_service_validator.js';
import err from '../../shared/errors/index.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/type_dto.js';

/**
 * @function _dto
 * @description DTO function for channel message upload types.
 * @param {Object} type
 * @returns {Object}
 */
const _dto = (type) => dto(type, 'channel_message_upload_type_');

/**
 * @class ChannelMessageUploadTypeService
 * @description Service class for channel message upload types.
 * @exports ChannelMessageUploadTypeService
 */
class ChannelMessageUploadTypeService {

    /**
     * @function findOne
     * @description Find a channel message upload type by name.
     * @param {Object} options
     * @param {string} options.name
     * @returns {Promise<Object>}
     */
    async findOne(options = { name: null }) {
        TypeServiceValidator.findOne(options);

        const type = await db.ChannelMessageUploadTypeView.findByPk(options.name);
        if (!type) throw new err.EntityNotFoundError('channel_message_upload_type');

        return _dto(type);
    }

    /**
     * @function findAll
     * @description Find all channel message upload types.
     * @param {Object} options
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { page: null, limit: null }) {
        options = TypeServiceValidator.findAll(options);

        const { page, limit, offset } = options;
        const [total, data] = await Promise.all([
            db.ChannelMessageUploadTypeView.count(),
            db.ChannelMessageUploadTypeView.findAll({
                ...(limit && { limit }),
                ...(offset && { offset }),
                order: [['channel_message_upload_type_created_at', 'DESC']]
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

const service = new ChannelMessageUploadTypeService();

export default service;
