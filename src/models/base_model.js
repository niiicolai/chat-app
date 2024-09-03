import MysqlAdapter from '../db/mysql.js'; 
import ControllerError from '../errors/controller_error.js';
/**
 * @class BaseModel
 * @description The base model class
 * @example
 * import BaseModel from './base_model.js';
 * 
 * // Define the model
 * const model = new BaseModel({
 *    singularName: 'upload_type',
 *    pluralName: 'upload_types',
 *    mysql_table: 'upload_types',
 *    pk: 'name',
 *    fields: ['description']
 * });
 * 
 * // Export the model
 * export default model;
 */
export default class BaseModel {

    /**
     * @constructor
     * @param {Object} options The options object
     * @param {String} options.pk The primary key
     * @param {Array} options.fields The fields
     * @param {String} options.singularName The singular name
     * @param {String} options.pluralName The plural name
     * @param {Object} options.mysql_table The MySQL table
     * @example
     * const model = new BaseModel({ pk: 'id', fields: ['name', 'email'], singularName: 'user', pluralName: 'users', 
 *    mysql_table: 'users' });
     * @throws {Error} If options are not provided
     * @throws {Error} If primary key is not provided
     * @throws {Error} If fields are not provided
     * @throws {Error} If singularName is not provided
     * @throws {Error} If pluralName is not provided
     * @throws {Error} If mysql_table is not provided
     */
    constructor(options = {
            pk: null, 
            fields: null, 
            singularName: null,
            pluralName: null,
            mysql_table: null,
            adapter: MysqlAdapter
        }) {
        if (!options) throw new Error('Options are required');
        if (!options.pk) throw new Error('Primary key is required');
        if (!options.fields) throw new Error('Fields are required');
        if (!options.singularName) throw new Error('singularName is required');
        if (!options.pluralName) throw new Error('pluralName is required');
        if (!options.mysql_table) throw new Error('mysql_table is required');

        this.pk = options.pk;
        this.fields = options.fields;
        this.singularName = options.singularName;
        this.pluralName = options.pluralName;
        this.mysql_table = options.mysql_table;
        this.adapter = options.adapter || MysqlAdapter;
    }

    /**
     * @function count
     * @description Count the number of records
     * @returns {Number} The number of records
     * @example
     * const model = new BaseModel({ pk: 'id', fields: ['name', 'email'], singularName: 'user', pluralName: 'users', 
 *    mysql_table: 'users' });
     * const count = model.count();
     * console.log(count); // 10
     */
    async count(options={ where: {}, include: [] }) {
        return await this.adapter.count(this, options);
    }

    /**
     * @function findAll
     * @description Find all records
     * @param {Object} options The options object
     * @param {Number} options.limit The number of records to return
     * @param {Number} options.offset The number of records to skip
     * @returns {Array} An array of records
     * @example
     * const model = new BaseModel({ pk: 'id', fields: ['name', 'email'], singularName: 'user', pluralName: 'users', 
 *    mysql_table: 'users' });
     * const records = model.findAll({ limit: 10, offset: 0 });
     * console.log(records); // [{ id: 1, name: 'John Doe', email: 'test@test.com' }]
     * @throws {Error} If options are not provided  
     * @throws {Error} If limit is not a number
     * @throws {Error} If offset is not a number
     */
    async findAll(options = {where: {}, include: []}) {
        if (!options) throw new Error('Options are required');
        return await this.adapter.findAll(this, options);
    }

    /**
     * @function template
     * @description Create a new object with all fields set to null
     * @returns {Object} A new object with all fields set to null
     * @example
     * const model = new BaseModel({ pk: 'id', fields: ['name', 'email'], singularName: 'user', pluralName: 'users', 
 *    mysql_table: 'users' });
     * const template = model.template();
     * console.log(template); // { id: null, name: null, email: null }
     */
    template() {
        const t = { [this.pk]: null };
        this.fields.forEach(f => t[f] = null);
        return t;
    }

    /**
     * @function create
     * @description Create a new record
     * @param {Object} body The request body
     * @returns {Object} The newly created record
     * @example
     * const model = new BaseModel({ pk: 'id', fields: ['name', 'email'], singularName: 'user', pluralName: 'users', 
 *    mysql_table: 'users' });
     * const record = model.create({ name: 'John Doe', email: 'test@test.com' });
     * console.log(record); // { id: 1, name: 'John Doe', email: 'test@test.com' }
     * @throws {Error} If the body is not provided
     * @throws {Error} If a required field is not provided
     */
    async create(body) {
        if (!body) throw new Error('Body is required');

        const params = {}
        this.fields.forEach(f => {
            if (!body[f]) throw new Error(`Field ${f} is required`);
            params[f] = body[f];
        });

        if (body[this.pk]) {
            params[this.pk] = body[this.pk];
        }

        await this.adapter.create(this, params); 
    }

    /**
     * @function findOne
     * @description Find a record by primary key
     * @param {String} pkValue The primary key value
     * @returns {Object} The record found
     * @example
     * const model = new BaseModel({ pk: 'id', fields: ['name', 'email'], singularName: 'user', pluralName: 'users', 
 *    mysql_table: 'users' });
     * const record = model.findOne(1);
     * console.log(record); // { id: 1, name: 'John Doe', email: 'test@test.com' }
     * @throws {Error} If no record is found with the primary key value
     */
    async findOne(options={pk: null, where: {}, include: []}) {
        if (!options.pk) throw new Error('Primary key value is required');
        return await this.adapter.findOne(this, options);
    }

    /**
     * @function findOneByField
     * @description Find a record by field
     * @param {String} fieldName The field name
     * @param {String} fieldValue The field value
     * @returns {Object} The record found
     */ 
    async findOneByField(options={fieldName: null, fieldValue: null, where: {}, include: []}) {
        if (!options.fieldName) throw new Error('fieldName is required');
        if (!options.fieldValue) throw new Error('fieldValue is required');
        return await this.adapter.findOneByField(this, options);
    }

    /**
     * @function update
     * @description Update a record by primary key
     * @param {String} pkValue The primary key value
     * @param {Object} body The request body
     * @returns {Object} The updated record
     * @example
     * const model = new BaseModel({ pk: 'id', fields: ['name', 'email'], singularName: 'user', pluralName: 'users', 
 *    mysql_table: 'users' });
     * const record = model.update(1, { name: 'Jane Doe', email: 'test@test.com' });
     * console.log(record); // { id: 1, name: 'Jane Doe', email: 'test@test.com' }
     * @throws {Error} If no record is found with the primary key value
     * @throws {Error} If the primary key value is not provided
     */
    async update(options={pk: null, body: null, where: {}, include: []}) {
        if (!options.pk) throw new Error('Primary key value is required');
        if (!options.body) throw new Error('Body is required');

        const findArgs = { pk: options.pk, where: options.where, include: options.include };
        const existing = await this.findOne(findArgs);
        if (!existing) 
            throw new ControllerError(404, 'Resource not found');

        const body = options.body;
        const params = {}
        this.fields.forEach(f => {
            if (body[f]) params[f] = body[f];
            else params[f] = existing[f];
        });

        await this.adapter.update(this, { pk: options.pk, body: params });
    }

    /**
     * @function destroy
     * @description Delete a record by primary key
     * @param {String} pkValue The primary key value
     * @example
     * const model = new BaseModel({ pk: 'id', fields: ['name', 'email'], singularName: 'user', pluralName: 'users', 
 *    mysql_table: 'users' });
     * model.destroy(1);
     * @throws {Error} If no record is found with the primary key value
     * @throws {Error} If the primary key value is not provided
     */
    async destroy(options={pk: null, where: {}, include: []}) {
        if (!options.pk) throw new Error('Primary key value is required');

        const findArgs = { pk: options.pk, where: options.where, include: options.include };
        const existing = await this.findOne(findArgs);
        if (!existing) throw new ControllerError(404, 'Resource not found');

        await this.adapter.destroy(this, options);
    }

    optionsBuilder() {
        const builder = { options: { include: [], where: {}} };

        builder.findAll = (page, limit) => {
            if (!isNaN(limit)) 
                builder.options.limit = limit;
            if (!isNaN(page) && !isNaN(limit)) 
                builder.options.offset = (page - 1) * limit;
            return builder;
        }

        builder.create = (body) => {
            builder.options.body = body;
            return builder;
        }

        builder.findOne = (pk) => {
            builder.options.pk = pk;
            return builder;
        }

        builder.findOneByField = (fieldName, fieldValue) => {
            builder.options.fieldName = fieldName;
            builder.options.fieldValue = fieldValue;
            return builder;
        }

        builder.update = (pk, body) => {
            builder.options.pk = pk;
            builder.options.body = body;
            return builder;
        }

        builder.destroy = (pk) => {
            builder.options.pk = pk;
            return builder;
        }

        builder.where = (key, value) => {
            if (!builder.options.where) builder.options.where = {};
            builder.options.where[key] = value;
            return builder;
        }

        builder.include = (model, field, model_field, model_table) => {
            if (!builder.options.include) builder.options.include = [];
            const p = { model, field };
            if (model_field) p.model_field = model_field;
            if (model_table) p.model_table = model_table
            builder.options.include.push(p);
            return builder;
        }

        builder.build = () => {
            return builder.options;
        }

        return builder;
    }
}
