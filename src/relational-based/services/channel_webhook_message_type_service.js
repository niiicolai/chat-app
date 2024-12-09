import TypeServiceValidator from '../../shared/validators/type_service_validator.js';
import err from '../../shared/errors/index.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/type_dto.js';

/**
 * @function _dto
 * @description DTO function for channel webhook message types.
 * @param {Object} type
 * @returns {Object}
 */
const _dto = (type) => dto(type, 'channel_webhook_message_type_');

/**
 * @class ChannelWebhookMessageTypeService
 * @description Service class for channel webhook message types.
 * @exports ChannelWebhookMessageTypeService
 */
class ChannelWebhookMessageTypeService {

    /**
     * @function findOne
     * @description Find a channel webhook message type by name.
     * @param {Object} options
     * @param {string} options.name
     * @returns {Promise<Object>}
     */
    async findOne(options = { name: null }) {
        TypeServiceValidator.findOne(options);

        const type = await db.ChannelWebhookMessageTypeView.findByPk(options.name);
        if (!type) throw new err.EntityNotFoundError('channel_webhook_message_type');

        return _dto(type);
    }

    /**
     * @function findAll
     * @description Find all channel webhook message types.
     * @param {Object} options
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { page: null, limit: null }) {
        options = TypeServiceValidator.findAll(options);

        const { page, limit, offset } = options;
        const [total, data] = await Promise.all([
            db.ChannelWebhookMessageTypeView.count(),
            db.ChannelWebhookMessageTypeView.findAll({
                ...(limit && { limit }),
                ...(offset && { offset }),
                order: [['channel_webhook_message_type_created_at', 'DESC']]
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

const service = new ChannelWebhookMessageTypeService();

export default service;
