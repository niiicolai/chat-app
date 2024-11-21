import TypeServiceValidator from '../../shared/validators/type_service_validator.js';
import ControllerError from '../../shared/errors/controller_error.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/type_dto.js';
import neo4j from 'neo4j-driver';

class Service {
    async findOne(options = { name: null }) {
        TypeServiceValidator.findOne(options);

        const result = await neodeInstance.model('ChannelType').find(options.name);
        if (!result) throw new ControllerError(404, 'channel_type not found');

        return dto(result.properties());
    }

    async findAll(options = { page: null, limit: null }) {
        options = TypeServiceValidator.findAll(options);

        const { page, limit, offset } = options;
        const result = await neodeInstance.batch([
            { query:
                `MATCH (uss:ChannelType) ORDER BY uss.created_at DESC ` +
                (offset ? `SKIP $offset `:``) + (limit ? `LIMIT $limit ` : ``) +
                `RETURN uss`,
              params: {
                ...(offset && { offset: neo4j.int(offset) }),
                ...(limit && { limit: neo4j.int(limit) }),
              }
            }, 
            { query: `MATCH (uss:ChannelType) RETURN COUNT(uss) AS count`, params: {} },
        ]);
        const total = result[1].records[0].get('count').low;
        return {
            total, 
            data: result[0].records.map(record => dto(record.get('uss').properties)),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }
}

const service = new Service();

export default service;
