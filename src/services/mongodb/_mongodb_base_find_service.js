import ControllerError from '../../errors/controller_error.js';

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

    async findOne(options = {}, onBeforeFind = (query) => query) {
        const { [this.pkName]: pk } = options;

        if (!pk) {
            throw new ControllerError(400, `${this.pkName} is required`);
        }

        if (typeof onBeforeFind !== 'function') {
            throw new ControllerError(500, 'onBeforeFind must be a function');
        }

        const query = this.model.findOne({ [this.pkName]: pk });
        const m = await onBeforeFind(query);
        if (!m) {
            throw new ControllerError(404, `${this.model.modelName} not found`);
        }

        return this.dto(m);
    }

    async findAll(options = { page: null, limit: null }, onBeforeFind = (query) => query) {
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

        const descendingByPK = { [this.pkName]: 1 };
        let query = this.model.find().sort(descendingByPK);
        const result = {};

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
        result.total = await this.model.countDocuments();

        return result;
    }
}
