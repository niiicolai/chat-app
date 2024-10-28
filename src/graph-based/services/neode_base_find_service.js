import neodeInstance from '../neode/index.js';
import ControllerError from '../../shared/errors/controller_error.js';
import neo4j from 'neo4j-driver';

export default class NeodeBaseFindService {
    constructor(pkName, modelName, dto) {
        if (!pkName) throw new Error('pkName is required');
        if (!modelName) throw new Error('modelName is required');
        if (!dto) throw new Error('dto is required');

        this.pkName = pkName;
        this.modelName = modelName;
        this.dto = dto;
    }

    async findOne(options) {
        if (!options) throw new ControllerError(400, 'Options are required');
        if (!options[this.pkName]) throw new ControllerError(400, `${this.pkName} is required`);

        const pk = options[this.pkName];
        const result = await neodeInstance.model(this.modelName).find(pk);
        if (!result) {
            throw new ControllerError(404, `${this.modelName} not found`);
        }

        const eagerRelationships = [];
        if (options.eager) {
            for (let i = 0; i < options.eager.length; i++) {
                const name = options.eager[i];
                const eagerInstance = result.get(name);
                const properties = eagerInstance?.endNode()?.properties();
                eagerRelationships.push({ [name]: properties });
            }
        }

        return this.dto(result.properties(), eagerRelationships);
    }

    async findAll(options = { page: null, limit: null }) {
        if (!options) throw new ControllerError(400, 'Options are required');
        if (options.page && isNaN(options.page)) throw new ControllerError(400, 'page must be a number');
        if (options.page && options.page < 1) throw new ControllerError(400, 'page must be greater than 0');
        if (options.limit && isNaN(options.limit)) throw new ControllerError(400, 'limit must be a number');
        if (options.limit && options.limit < 1) throw new ControllerError(400, 'limit must be greater than 0');
        if (options.page && !options.limit) throw new ControllerError(400, 'page requires limit');

        let { page, limit } = options;

        if (page) page = parseInt(page);
        if (limit) limit = parseInt(limit);

        let cypher = `MATCH (n:${this.modelName}) RETURN n`;
        const params = {};

        if (page && limit) {
            const skip = neo4j.int(((page - 1) * limit));
            cypher += ` SKIP $skip LIMIT $limit`;
            params.skip = neo4j.int(skip);
            params.limit = neo4j.int(limit);
        } else if (limit) {
            cypher += ` LIMIT $limit`;
            params.limit = neo4j.int(limit);
        }

        const records = await neodeInstance.cypher(cypher, params);
        const count = await neodeInstance.cypher(`MATCH (n:${this.modelName}) RETURN count(n)`);
        const total = count.records[0].get('count(n)').low;
        const types = records.records.map((record) => record.get('n').properties);

        const data = types.map((type) => this.dto(type));
        const result = { total, data };

        if (page) {
            result.page = page;
            result.pages = Math.ceil(total / limit);
        }

        if (limit) {
            result.limit = limit;
        }

        return result;
    }
}
