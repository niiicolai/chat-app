import ControllerError from "../errors/controller_error.js";

/**
 * @class BaseCrudService
 * @description Base class for CRUD services
 * @example
 * import BaseCrudService from './base_crud_service.js';
 * import model from '../models/room_category.js';
 * import dto from '../dtos/room_category.js';
 * 
 * // Create a new service
 * const service = new BaseCrudService({ model, dto });
 * 
 * // Export the service
 * export default service;
 */
export default class BaseCrudService {

    /**
     * @constructor
     * @param {Object} options
     * @param {Object} options.model
     * @param {Object} options.dto
     * @throws {Error} If options is not provided
     * @throws {Error} If model is not provided
     * @throws {Error} If dto is not provided
     * @example
     * const service = new BaseCrudService({ model, dto });
     */
    constructor(options = {model: null, dto: null}) {
        if (!options) throw new Error('options is required');
        if (!options.model) throw new Error('model is required');
        if (!options.dto) throw new Error('dto is required');
        
        this.model = options.model;
        this.dto = options.dto;
    }

    /**
     * @function findAll
     * @description Find all records
     * @param {Number} page The page number (default: 1)
     * @param {Number} limit The number of records per page (default: 10)
     * @returns {Object} The records and metadata
     * @example
     * const data = service.findAll(1, 10);
     * console.log(data); // { data: [], meta: { total: 0, page: 1, pages: 0 } }
     */
    async findAll(page, limit) {
        if (isNaN(page)) page = 1;
        if (isNaN(limit)) limit = 10;

        const offset = (page - 1) * limit;
        const total = this.model.count();
        const pages = Math.ceil(total / limit);
        const data = await this.model.findAll({
            offset: offset,
            limit: limit,
        });
        
        return {
            data: data.map(d => this.dto(d)),
            meta: {
                total: total,
                page: page,
                pages: pages,
            }
        };
    }

    /**
     * @function template
     * @description Get the template
     * @returns {Object} The template
     * @example
     * const template = service.template();
     * console.log(template); // { name: '', description: '', room_category_name: '' }
     */
    template() {
        return this.dto(this.model.template());
    }

    /**
     * @function create
     * @description Create a new record
     * @param {Object} body The request body
     * @throws {ControllerError} If the resource already exists
     * @example
     * service.create({ name: 'Room 1', description: 'Room 1', room_category_name: 'Standard' });
     * @throws {ControllerError} If the resource already exists
     */
    async create(body, file=null) {
        const pkValue = body[this.model.pk];
        if (this.model.findOne(pkValue)) {
            throw new ControllerError(400, 'Resource already exists');
        }
        await this.model.create(body);
        const resource = await this.model.findOne(pkValue);
        return this.dto(resource);
    }

    /**
     * @function findOne
     * @description Find a record by primary key
     * @param {String} pkValue The primary key value
     * @returns {Object} The record
     * @throws {ControllerError} If the resource is not found
     * @example
     * const resource = service.findOne('1');
     * console.log(resource); // { name: 'Room 1', description: 'Room 1', room_category_name: 'Standard' }
     */
    async findOne(pkValue) {
        const resource = await this.model.findOne(pkValue);
        if (!resource) {
            throw new ControllerError(404, 'Resource not found');
        }

        return this.dto(resource);
    }

    /**
     * @function update
     * @description Update a record by primary key
     * @param {String} pkValue The primary key value
     * @param {Object} body The request body
     * @throws {ControllerError} If the resource is not found
     * @example
     * service.update('1', { name: 'Room 1', description: 'Room 1', room_category_name: 'Standard' });
     */
    async update(pkValue, body, file=null) {
        const resource = await this.model.findOne(pkValue);
        if (!resource) {
            throw new ControllerError(404, 'Resource not found');
        }

        await this.model.update(pkValue, body);
    }

    /**
     * @function destroy
     * @description Destroy a record by primary key
     * @param {String} pkValue The primary key value
     * @throws {ControllerError} If the resource is not found
     * @example
     * service.destroy('1');
     */
    async destroy(pkValue) {
        const resource = await this.model.findOne(pkValue);
        if (!resource) {
            throw new ControllerError(404, 'Resource not found');
        }

        await this.model.destroy(pkValue);
    }
}
