import MySQLAdapter from '../db/mysql.js'; 
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
            mysql_table: null
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
        this.adapter = MySQLAdapter;
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
    async count(where={}) {
        return await this.adapter.count(this, where);
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
    async findAll(options = {limit: null, offset: null}, where={}) {
        if (!options) throw new Error('Options are required');
        if (isNaN(options.limit)) throw new Error('Limit must be a number');
        if (isNaN(options.offset)) throw new Error('Offset must be a number');
        return await this.adapter.findAll(this, options.limit, options.offset, where);
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
    async findOne(pkValue) {
        if (!pkValue) throw new Error(`${this.pk} is required`);
        return await this.adapter.findOne(this, pkValue);
    }

    /**
     * @function findOneByField
     * @description Find a record by field
     * @param {String} fieldName The field name
     * @param {String} fieldValue The field value
     * @returns {Object} The record found
     */ 
    async findOneByField(fieldName, fieldValue) {
        if (!fieldName) throw new Error('fieldName is required');
        if (!fieldValue) throw new Error('fieldValue is required');
        return await this.adapter.findOneByField(this, fieldName, fieldValue);
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
    async update(pkValue, body) {
        if (!pkValue) throw new Error(`${this.pk} is required`);

        const existing = await this.findOne(pkValue);
        if (!existing) throw new ControllerError(404, 'Resource not found');

        const params = {}
        this.fields.forEach(f => {
            if (body[f]) params[f] = body[f];
            else params[f] = existing[f];
        });

        await this.adapter.update(this, params, this.pk, pkValue);
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
    async destroy(pkValue) {
        if (!pkValue) throw new Error(`${this.pk} is required`);

        const existing = await this.findOne(pkValue);
        if (!existing) throw new ControllerError(404, 'Resource not found');

        await this.adapter.destroy(this, this.pk, pkValue);
    }
}
