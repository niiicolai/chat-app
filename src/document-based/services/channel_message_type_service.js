import TypeServiceValidator from '../../shared/validators/type_service_validator.js';
import EntityNotFoundError from '../../shared/errors/entity_not_found_error.js';
import ChannelMessageType from '../mongoose/models/channel_message_type.js';
import dto from '../dto/type_dto.js';

class Service {
    async findOne(options = { name: null }) {
        TypeServiceValidator.findOne(options);

        const result = await ChannelMessageType.findOne({ _id: options.name });
        if (!result) throw new EntityNotFoundError('channel_message_type');

        return dto(result._doc);
    }

    async findAll(options = { page: null, limit: null }) {
        options = TypeServiceValidator.findAll(options);

        const { page, limit, offset } = options;
        const [total, data] = await Promise.all([
            ChannelMessageType.find().countDocuments(),
            ChannelMessageType.find()
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
