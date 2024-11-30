import TypeServiceValidator from '../../shared/validators/type_service_validator.js';
import ControllerError from '../../shared/errors/controller_error.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/type_dto.js';

class Service {
    async findOne(options = { name: null }) {
        TypeServiceValidator.findOne(options);

        const result = await neodeInstance.model('ChannelMessageType').find(options.name);
        if (!result) throw new ControllerError(404, 'channel_message_type not found');

        return dto(result.properties());
    }

    async findAll(options = { page: null, limit: null }) {
        options = TypeServiceValidator.findAll(options);

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

const service = new Service();

export default service;

