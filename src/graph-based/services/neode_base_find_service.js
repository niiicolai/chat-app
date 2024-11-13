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

    /**
     * @function findAll
     * @param {Object} options
     * @param {Number} options.page - The page number (optional) (requires limit)
     * @param {Number} options.limit - The number of items per page
     * @param {Array} options.override.match - Override the default Cypher match statement (optional)
     * @param {Object} options.override.params - Parameters to be passed to the Cypher find query (optional)
     * @param {Array} options.override.return - Override the default Cypher return statement (optional)
     * @param {Object} options.override.map - Specify which returned data is the model and which are relationships (optional)
     * @example findAll({ page: 1, limit: 10, override: {
            match: [
                'MATCH (c:Channel)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid})',
                'MATCH (c)-[:HAS_CHANNEL_TYPE]->(ct:ChannelType)',
                'OPTIONAL MATCH (c)-[:HAS_CHANNEL_FILE]->(rf:RoomFile)',
            ],
            return: ['c', 'r', 'ct', 'rf'],
            map: { model: 'c', relationships: [
                { alias: 'r', to: 'room' },
                { alias: 'ct', to: 'channelType' },
                { alias: 'rf', to: 'roomFile' },
            ]},
            params: { room_uuid }
        }}); 
     */
    async findAll(options = { page: null, limit: null, override: null }) {
        if (!options) throw new ControllerError(400, 'Options are required');
        if (options.page && isNaN(options.page)) throw new ControllerError(400, 'page must be a number');
        if (options.page && options.page < 1) throw new ControllerError(400, 'page must be greater than 0');
        if (options.limit && isNaN(options.limit)) throw new ControllerError(400, 'limit must be a number');
        if (options.limit && options.limit < 1) throw new ControllerError(400, 'limit must be greater than 0');
        if (options.page && !options.limit) throw new ControllerError(400, 'page requires limit');

        let { page, limit } = options;

        if (page) page = parseInt(page);
        if (limit) limit = parseInt(limit);

        let params = {};
        
        if (page && limit) params.offset = neo4j.int((page - 1) * limit);
        if (limit) params.limit = neo4j.int(limit);
        if (options.override?.params) params = { ...params, ...options.override.params };

        const mapModel = options.override?.map 
            ? options.override.map.model 
            : 'm';

        const mapRelationships = options.override?.map 
            ? options.override.map.relationships 
            : [];

        const match = options.override?.match 
            ? options.override.match.map(match => match).join(' ') 
            : `MATCH (m:${this.modelName}) `;

        const skip = page && limit ? ` SKIP $offset ` : '';
        const limitSt = page && limit ? ` LIMIT $limit ` : '';
        const order = ` ORDER BY ${mapModel}.created_at DESC`;
        
        const returnSt = options.override?.return 
            ? ` RETURN ` + options.override.return.map(returnStatement => returnStatement).join(', ') 
            : ' RETURN m';

        const dbResult = await neodeInstance.batch([
            { query: match + order + skip + limitSt + returnSt, params },
            { query: match + ` RETURN COUNT(${mapModel}) AS count`, params }
        ]);

        const data = dbResult[0].records.map(record => {
            const m = record.get(mapModel).properties;
            const rel = mapRelationships
                .map(rel => { return { 
                    [rel.to]: record.get(rel.alias)?.properties 
                }})
                .filter(rel => rel[Object.keys(rel)[0]]);

            return this.dto(m, rel);
        });

        const total = dbResult[1].records[0].get('count').low;
        const result = { total, data };

        if (page) {
            result.page = page;
            result.pages = Math.ceil(total / limit);
        }

        if (limit) result.limit = limit;

        return result;
    }
}
