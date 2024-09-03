
export default class BaseAdapter {
    constructor() {
    }

    async count(model, options) {
        throw new Error('count method not implemented');
    }

    async findAll(model, options) {
        throw new Error('findAll method not implemented');
    }

    async findOne(model, options) {
        throw new Error('findOne method not implemented');
    }

    async findOneByField(model, options) {
        throw new Error('findOneByField method not implemented');
    }

    async create(model, options) {
        throw new Error('create method not implemented');
    }

    async update(model, options) {
        throw new Error('update method not implemented');
    }

    async destroy(model, options) {
        throw new Error('destroy method not implemented');
    }
}
