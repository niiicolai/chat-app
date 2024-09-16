import ControllerError from "../../errors/controller_error.js";

export default class MysqlBaseFindService {
    constructor(model, dto) {
        this.model = model;
        this.dto = dto;
        this.name = this.model.getTableName().replace('_view', '');
        this.pkName = this.model.primaryKeyAttributes[0];
    }

    async findOne(options = {}) {
        const { [this.pkName]: pk } = options;

        if (!pk) {
            throw new ControllerError(400, `${this.pkName} is required`);
        }

        const m = await this.model.findOne({ where: { [this.pkName]: pk } });
        if (!m)  {
            throw new ControllerError(404, `${this.name} not found`);
        }

        return this.dto(m);
    }

    async findAll(options = { page: null, limit: null }) {  
        const { page, limit } = options;

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
            
        const params = { order: [[`${this.name}_created_at`, 'DESC']] };

        if (limit) {
            params.limit = parseInt(limit);
        }

        if (page && !isNaN(page) && limit) {
            params.offset = parseInt(page - 1) * params.limit;
        }

        const total = await this.model.count();
        const data = (await this.model.findAll(params)).map((m) => this.dto(m));
        const res = { total, data };

        if (page) res.page = parseInt(page);
        if (limit) res.limit = params.limit;

        return res;
    }
}
