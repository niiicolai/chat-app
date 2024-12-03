import Validator from '../../shared/validators/type_service_validator.js';
import err from '../../shared/errors/index.js';
import ChannelMessageUploadType from '../mongoose/models/channel_message_upload_type.js';
import dto from '../dto/type_dto.js';

/**
 * @class ChannelMessageUploadTypeService
 * @description Service class for channel message upload types.
 * @exports ChannelMessageUploadTypeService
 */
class ChannelMessageUploadTypeService {

    /**
     * @function findOne
     * @description Find a channel message upload type by name
     * @param {Object} options
     * @param {String} options.name
     * @returns {Promise<Object>}
     */
    async findOne(options = { name: null }) {
        Validator.findOne(options);

        const result = await ChannelMessageUploadType.findOne({ _id: options.name });
        if (!result) throw new err.EntityNotFoundError('channel_message_upload_type');

        return dto(result._doc);
    }

    /**
     * @function findAll
     * @description Find all channel message upload types
     * @param {Object} options
     * @param {Number} options.page optional
     * @param {Number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { page: null, limit: null }) {
        options = Validator.findAll(options);

        const { page, limit, offset } = options;
        const [total, data] = await Promise.all([
            ChannelMessageUploadType.find().countDocuments(),
            ChannelMessageUploadType.find()
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

const service = new ChannelMessageUploadTypeService();

export default service;
