
import BaseAdapter from './base_adapter.js';

class Neo4jAdapter extends BaseAdapter {
    constructor(model) {
        super(model);
    }

    async count(options={}) {
        throw new Error('count method not implemented');
    }

    async sum(options={}) {
        throw new Error('sum method not implemented');
    }

    async max(options={}) {
        throw new Error('max method not implemented');
    }

    async min(options={}) {
        throw new Error('min method not implemented');
    }

    async find(options={}) {
        throw new Error('findAll method not implemented');
    }

    async create(options={}) {
        throw new Error('create method not implemented');
    }

    async update(options={}) {
        throw new Error('update method not implemented');
    }

    async destroy(options={}) {
        throw new Error('destroy method not implemented');
    }

    async transaction(callback) {
        throw new Error('count method not implemented');
    }
}

const adapter = new Neo4jAdapter();

export default adapter;
