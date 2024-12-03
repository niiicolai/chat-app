import Validator from '../../shared/validators/type_service_validator.js';
import err from '../../shared/errors/index.js';
import ChannelAuditType from '../mongoose/models/channel_audit_type.js';
import dto from '../dto/type_dto.js';

/**
 * @class ChannelAuditTypeService
 * @description Service class for channel audit types. 
 * @exports ChannelAuditTypeService
 */
class ChannelAuditTypeService {

    /**
     * @function findOne
     * @description Find a channel audit type by name
     * @param {Object} options
     * @param {String} options.name
     * @returns {Promise<Object>}
     */
    async findOne(options = { name: null }) {
        Validator.findOne(options);

        const result = await ChannelAuditType.findOne({ _id: options.name });
        if (!result) throw new err.EntityNotFoundError('channel_audit_type');

        return dto(result._doc);
    }

    /**
     * @function findAll
     * @description Find all channel audit types
     * @param {Object} options
     * @param {Number} options.page optional
     * @param {Number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { page: null, limit: null }) {
        options = Validator.findAll(options);

        const { page, limit, offset } = options;
        const [total, data] = await Promise.all([
            ChannelAuditType.find().countDocuments(),
            ChannelAuditType.find()
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

const service = new ChannelAuditTypeService();

export default service;
