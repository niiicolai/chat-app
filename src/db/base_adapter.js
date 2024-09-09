import BaseModel from '../models/base_model.js';

/**
 * @class BaseAdapter
 * @description Base class for all database adapters
 * @requires BaseModel
 */
export default class BaseAdapter {

    /**
     * @constructor
     * @param {BaseModel} model
     */
    constructor(model) {
        if (!(model instanceof BaseModel)) 
            throw new Error('Model must be an instance of BaseModel');

        this.model = model;
    }

    /**
     * @function count
     * @description Count the number of entities
     * @param {Object} options
     * @returns {Promise<number>}
     */
    async count(options={}) {
        throw new Error('count method not implemented');
    }

    /**
     * @function sum
     * @description Sum the values of a field
     * @param {Object} options
     * @returns {Promise<number>}
     */
    async sum(options={}) {
        throw new Error('sum method not implemented');
    }

    /**
     * @function max
     * @description Find the maximum value of a field
     * @param {Object} options
     * @returns {Promise<number>}
     */
    async max(options={}) {
        throw new Error('max method not implemented');
    }

    /**
     * @function min
     * @description Find the minimum value of a field
     * @param {Object} options
     * @returns {Promise<number>}
     */
    async min(options={}) {
        throw new Error('min method not implemented');
    }

    /**
     * @function find
     * @description Find entities
     * @param {Object} options
     * @returns {Promise<Array>}
     */
    async find(options={}) {
        throw new Error('findAll method not implemented');
    }

    /**
     * @function create
     * @description Create a new entity
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async create(options={}) {
        throw new Error('create method not implemented');
    }

    /**
     * @function update
     * @description Update an entity
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async update(options={}) {
        throw new Error('update method not implemented');
    }

    /**
     * @function destroy
     * @description Destroy an entity
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async destroy(options={}) {
        throw new Error('destroy method not implemented');
    }

    /**
     * @function transaction
     * @description Perform a transaction
     * @param {Function} callback
     * @returns {Promise<Object>}
     */
    async transaction(callback) {
        throw new Error('count method not implemented');
    }
}
