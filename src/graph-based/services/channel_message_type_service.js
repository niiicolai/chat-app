import Validator from '../../shared/validators/type_service_validator.js';
import err from '../../shared/errors/index.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/type_dto.js';

/**
 * @class ChannelMessageTypeService
 * @description Service class for channel message types.
 * @exports ChannelMessageTypeService
 */
class ChannelMessageTypeService {

    /**
     * @function findOne
     * @description Find a channel message type by name.
     * @param {Object} options
     * @param {string} options.name
     * @returns {Promise<Object>}
     */
    async findOne(options = { name: null }) {
        Validator.findOne(options);

        const result = await neodeInstance.model('ChannelMessageType').find(options.name);
        if (!result) throw new err.EntityNotFoundError('channel_message_type');

        return dto(result.properties());
    }

    /**
     * @function findAll
     * @description Find all channel message types.
     * @param {Object} options
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { page: null, limit: null }) {
        options = Validator.findAll(options);

        const { page, limit, offset } = options;
        const [ total, data ] = await Promise.all([
            neodeInstance.cypher("MATCH (n:ChannelMessageType) RETURN count(n) as total")
                .then(result => result.records[0].get('total').toNumber()),
            neodeInstance.model("ChannelMessageType")
                .all({}, {created_at: 'DESC'}, (limit || 0), (offset || 0))
                .then(results => results.map(result => dto(result.properties())))
        ]);
        return {
            total, 
            data,
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }
}

const service = new ChannelMessageTypeService();

export default service;

