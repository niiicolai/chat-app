
import BaseAdapter from './base_adapter.js';

class MongoAdapter extends BaseAdapter {
    constructor() {
        super();
    }

    async count(model, options) {
        if (!model) throw new Error('Model is required');
        if (!model.mysql_table) throw new Error('Model mysql_table is required');
        if (!model.pk) throw new Error('Model pk is required');
        if (!options) throw new Error('Options are required');

        const req = {}

        throw new Error('Method not implemented');
    }

    async findAll(model, options) {
        if (!model) throw new Error('Model is required');
        if (!model.mysql_table) throw new Error('Model mysql_table is required');
        if (!options) throw new Error('Options are required');

        const req = {}

        throw new Error('Method not implemented');
    }

    async findOne(model, options) {
        if (!model) throw new Error('Model is required');
        if (!model.mysql_table) throw new Error('Model mysql_table is required');
        if (!model.pk) throw new Error('Model pk is required');
        if (!options) throw new Error('Options are required');
        if (!options.pk) throw new Error('Primary key is required');

        const req = {}

        throw new Error('Method not implemented');
    }

    async findOneByField(model, options) {
        if (!model) throw new Error('Model is required');
        if (!model.mysql_table) throw new Error('Model mysql_table is required');
        if (!options) throw new Error('Options are required');
        if (!options.fieldName) throw new Error('Field name is required');
        if (!options.fieldValue) throw new Error('Field value is required');

        const req = {}

        throw new Error('Method not implemented');
    }

    async create(model, options) {
        if (!model) throw new Error('Model is required');
        if (!model.mysql_table) throw new Error('Model mysql_table is required');
        if (!options) throw new Error('Options are required');

        const req = {}

        throw new Error('Method not implemented');
    }

    async update(model, options) {
        if (!model) throw new Error('Model is required');
        if (!model.mysql_table) throw new Error('Model mysql_table is required');
        if (!model.pk) throw new Error('Model pk is required');
        if (!options) throw new Error('Options are required');
        if (!options.pk) throw new Error('Primary key is required');
        if (!options.body) throw new Error('Body is required');

        const req = {}

        throw new Error('Method not implemented');
    }

    async destroy(model, options) {
        if (!model) throw new Error('Model is required');
        if (!model.mysql_table) throw new Error('Model mysql_table is required');
        if (!model.pk) throw new Error('Model pk is required');
        if (!options) throw new Error('Options are required');
        if (!options.pk) throw new Error('Primary key is required');

        const req = {}

        throw new Error('Method not implemented');
    }
}

const adapter = new MongoAdapter();

export default adapter;
