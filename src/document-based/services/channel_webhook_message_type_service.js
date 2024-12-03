import Validator from '../../shared/validators/type_service_validator.js';
import err from '../../shared/errors/index.js';
import ChannelWebhookMessageType from '../mongoose/models/channel_webhook_message_type.js';
import dto from '../dto/type_dto.js';

/**
 * @class ChannelWebhookMessageTypeService
 * @description Service class for channel webhook message types.
 * @exports ChannelWebhookMessageTypeService
 */
class ChannelWebhookMessageTypeService {

    /**
     * @function findOne
     * @description Find a channel webhook message type by name
     * @param {Object} options
     * @param {String} options.name
     * @returns {Promise<Object>}
     */
    async findOne(options = { name: null }) {
        Validator.findOne(options);

        const result = await ChannelWebhookMessageType.findOne({ _id: options.name });
        if (!result) throw new err.EntityNotFoundError('channel_webhook_message_type');

        return dto(result._doc);
    }

    /**
     * @function findAll
     * @description Find all channel webhook message types
     * @param {Object} options
     * @param {Number} options.page optional
     * @param {Number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { page: null, limit: null }) {
        options = Validator.findAll(options);

        const { page, limit, offset } = options;
        const [total, data] = await Promise.all([
            ChannelWebhookMessageType.find().countDocuments(),
            ChannelWebhookMessageType.find()
                .sort({ created_at: -1 })
                .limit(limit || 0)
                .skip((page && limit) ? offset : 0)
                .then((types) => types.map((type) => dto(type._doc))),
        ]);

        return {
            total, data,
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }
}

const service = new ChannelWebhookMessageTypeService();

export default service;
