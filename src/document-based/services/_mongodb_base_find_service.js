import ControllerError from '../../shared/errors/controller_error.js';

export default class MongodbBaseFindService {
    constructor(model, dto, pkName) {
        if (!model) {
            throw new Error('model is required');
        }
        if (!dto) {
            throw new Error('dto is required');
        }
        if (!pkName) {
            throw new Error('pkName is required');
        }

        this.model = model;
        this.dto = dto;
        this.pkName = pkName;
    }

    async findOne(options = {}, onBeforeFind = (query) => query, where = {}) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options[this.pkName]) throw new ControllerError(400, `${this.pkName} is required`);
        if (typeof options[this.pkName] !== 'string') throw new ControllerError(400, `${this.pkName} must be a string`);
        if (typeof onBeforeFind !== 'function') throw new ControllerError(500, 'onBeforeFind must be a function');
        if (typeof where !== 'object') throw new ControllerError(500, 'where must be an object');

        const { [this.pkName]: pk } = options;
        const query = this.model.findOne({ ...where, [this.pkName]: pk });
        const m = await onBeforeFind(query);
        
        if (!m) throw new ControllerError(404, `${this.model.modelName} not found`);

        return this.dto(m);
    }

    /**
     * @function findAll
     * @param {Object} options
     * @param {Number} options.page
     * @param {Number} options.limit
     * @param {Object} options.where
     * @param {Object} options.aggregate
     * @param {Function} onBeforeFind
     */
    async findAll(options = { page: null, limit: null, where: null, aggregate: null }, onBeforeFind = (query) => query) {
        let { page, limit } = options;

        if (typeof onBeforeFind !== 'function') {
            throw new ControllerError(500, 'onBeforeFind must be a function');
        }

        if (page && isNaN(page)) {
            throw new ControllerError(400, 'page must be a number');
        }

        if (page && page < 1) {
            throw new ControllerError(400, 'page must be greater than 0');
        }

        if (limit && limit < 1) {
            throw new ControllerError(400, 'limit must be greater than 0');
        }

        if (limit && isNaN(limit)) {
            throw new ControllerError(400, 'limit must be a number');
        }

        if (page && !limit) {
            throw new ControllerError(400, 'page requires limit');
        }

        const descendingByDate = { created_at: -1 };
        let params = {};
        if (options.where) params = { ...params, ...options.where };

        let query = this.model.find(params).sort(descendingByDate);

        const result = {};

        if (Array.isArray(options.aggregate)) {
            query = query.aggregate(options.aggregate);
        }

        if (limit) {
            limit = parseInt(limit);
            query = query.limit(limit);
            result.limit = limit
        }


        if (page && !isNaN(page) && limit) {
            page = parseInt(page);
            const offset = ((page - 1) * limit);
            query = query.skip(offset);
            result.page = page;
        }

        query = onBeforeFind(query);

        result.data = (await query).map((m) => this.dto(m));
        result.total = await this.model.countDocuments(params);

        if (page && !isNaN(page) && limit) {
            result.pages = Math.ceil(result.total / limit);
        }

        return result;
    }
}
