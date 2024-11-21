import TypeServiceValidator from '../../shared/validators/type_service_validator.js';
import ControllerError from '../../shared/errors/controller_error.js';
import ChannelWebhookMessageType from '../mongoose/models/channel_webhook_message_type.js';
import dto from '../dto/type_dto.js';

class Service {
    async findOne(options = { name: null }) {
        TypeServiceValidator.findOne(options);

        const result = await ChannelWebhookMessageType.findOne({ name: options.name });
        if (!result) throw new ControllerError(404, 'channel_webhook_message_type not found');

        return dto(result._doc);
    }

    async findAll(options = { page: null, limit: null }) {
        options = TypeServiceValidator.findAll(options);

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

const service = new Service();

export default service;
