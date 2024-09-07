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
            requiredFields: null,
            singularName: null,
            pluralName: null,
            mysql_table: null,
            create_timestamp: null,
            update_timestamp: null,
            adapter: MysqlAdapter
        }) {
        if (!options) throw new Error('Options are required');
        if (!options.pk) throw new Error('Primary key is required');
        if (!options.fields) throw new Error('Fields are required');
        if (!options.requiredFields) throw new Error('requiredFields are required');
        if (!options.singularName) throw new Error('singularName is required');
        if (!options.pluralName) throw new Error('pluralName is required');
        if (!options.mysql_table) throw new Error('mysql_table is required');

        this.pk = options.pk;
        this.fields = options.fields;
        this.requiredFields = options.requiredFields;
        this.singularName = options.singularName;
        this.pluralName = options.pluralName;
        this.mysql_table = options.mysql_table;
        this.create_timestamp = options.create_timestamp;
        this.update_timestamp = options.update_timestamp;
        this.adapter = options.adapter || new MysqlAdapter(this);
        this.operation = null;
    }

    template() {
        const t = { [this.pk]: null };
        this.fields.forEach(f => t[f] = null);
        return t;
    }

    async defineTransaction(callback) {
        return await this.adapter.transaction(callback);
    }

    throwIfNotPresent(input, message) {
        if (!isNaN(input)) return this;
        if (Array.isArray(input) && input.length === 0) 
            throw new ControllerError(400, message);
        if (!input) 
            throw new ControllerError(400, message);
        return this;
    }

    count() {
        this.operation = { method: 'count', options: {}, conditions: {} };
        return this.subMethods();
    }

    sum(options={ field: null }) {
        if (!options.field) throw new Error('Field is required');
        this.operation = { method: 'sum', options, conditions: {} };
        return this.subMethods();
    }

    find(options={}) {
        const page = options.page;
        const limit = options.limit;
        const opt = { };
        if (!isNaN(limit)) opt.limit = limit;
        if (!isNaN(page) && !isNaN(limit)) {
            opt.offset = (page - 1) * limit;
        }

        this.operation = { method: 'find', options: opt, conditions: { page, limit } };
        return this.subMethods();
    }
    
    create(options={body: null}) {
        if (!options.body) throw new Error('Body is required');
        
        const body = options.body;
        const params = {};
        this.fields.forEach(f => {            
            if (!body[f] && this.requiredFields.includes(f) && isNaN(body[f]))
                throw new Error(`Field ${f} is required`);
            params[f] = body[f];
        });

        if (body[this.pk]) {
            params[this.pk] = body[this.pk];
        }

        this.operation = { method: 'create', options: { body: params }, conditions: {} };
        return this.subMethods();
    }

    update(options={body: null}) {
        if (!options.body) throw new Error('Body is required');

        const body = options.body;
        const params = {}
        this.fields.forEach(f => {
            if (body[f]) params[f] = body[f];
            else params[f] = existing[f];
        });

        this.operation = { method: 'update', options: { body: params }, conditions: {} };
        return this.subMethods();
    }

    destroy() {
        this.operation = { method: 'destroy', options: {}, conditions: {} };
        return this.subMethods();
    }

    async execute(options={}) {        
        if (!this.operation) throw new Error('Operation is required');                
        let result = await this.adapter[this.operation.method]({ 
            ...options, 
            ...this.operation.options 
        });        
        
        if (Array.isArray(result)) {
            let { meta, dto, page, limit } = this.operation.conditions;
            if (dto) result = result.map(dto);
            
            if (meta) {
                const total = await this.adapter.count(options);
                if (!page) page = 1;
                if (!limit) limit = total;
                const pages = Math.ceil(total / limit);
                result = { data: result, meta: { total, page, pages } };
            }
        }

        return result;
    }

    async executeOne(options={}) {
        if (!this.operation) throw new Error('Operation is required');
        if (!this.operation.method === 'find') throw new Error('executeOne only works for find');    
        const rows = await this.adapter[this.operation.method]({
            ...options,
            ...this.operation.options
        });
        
        const { dto, notFound, found } = this.operation.conditions;
        if (rows.length === 0 && notFound)
            throw new ControllerError(notFound.status, notFound.message);
        else if (rows.length > 0 && found)
            throw new ControllerError(found.status, found.message);
        else if (rows.length === 0) return null;
        
        if (dto) return dto(rows[0]);
        return rows[0];
    }

    /**
     * Define sub methods that can be chained
     * for all base methods.
     */
    subMethods() {
        if (!this.operation) throw new Error('Operation is required');

        const model = this;
        const sub = { options: {} }

        sub.where = (key, value, operator='=') => {
            if (!sub.options.where) sub.options.where = {};
            sub.options.where[key] = { value, operator };
            return sub;
        }

        sub.include = (model, field, other_field, other_table) => {
            const p = { model, field };            
            if (!sub.options.include) sub.options.include = [];            
            if (other_field) p.model_field = other_field;
            if (other_table) p.model_table = other_table
            sub.options.include.push(p);
            return sub;
        }

        sub.orderBy = (orderBy) => {
            sub.options.orderBy = orderBy;
            return sub;
        }

        sub.transaction = (transaction) => {
            sub.options.transaction = transaction;
            return sub;
        }

        sub.throwIfNotFound = (message=`${model.singularName} not found`) => {
            model.operation.conditions.notFound = { status: 404, message };
            return sub;
        }

        sub.throwIfFound = (message=`${model.singularName} already exists`) => {
            model.operation.conditions.found = { status: 400, message };
            return sub;
        }

        sub.dto = (dto) => {
            model.operation.conditions.dto = dto;
            return sub;
        }

        sub.meta = () => {
            model.operation.conditions.meta = true;
            return sub;
        }

        sub.each = (arr, callback) => {
            if (!Array.isArray(arr)) throw new Error('Array is required');
            if (!callback) throw new Error('Callback is required');
            for (let i = 0; i < arr.length; i++) {
                const data = arr[i];
                sub.options = callback(data, sub.options);
            }
            return sub;
        }

        sub.execute = async () => {            
            return model.execute(sub.options);
        }        

        sub.executeOne = async () => {
            return model.executeOne(sub.options);
        }

        return sub;
    }

    optionsBuilder() {
        const builder = { options: { include: [], where: {}}, method: null };

        builder.sum = (field) => {
            builder.options.field = field;
            builder.method = 'sum';
            return builder;
        }

        builder.find = (options={}) => {
            if (!isNaN(options.limit)) builder.options.limit = limit;
            if (!isNaN(options.page) && !isNaN(limit)) builder.options.offset = (page - 1) * limit;
            builder.method = 'find';
            return builder;
        }

        builder.create = (body) => {
            builder.options.body = body;
            builder.method = 'create';
            return builder;
        }

        builder.update = (body) => {
            builder.method = 'update';
            builder.options.body = body;
            return builder;
        }

        builder.destroy = () => {
            builder.method = 'destroy';
            return builder;
        }

        builder.where = (key, value, operator='=') => {
            if (!builder.options.where) builder.options.where = {};
            builder.options.where[key] = { value, operator };
            return builder;
        }

        builder.include = (model, field, model_field, model_table) => {
            const p = { model, field };            
            if (!builder.options.include) builder.options.include = [];            
            if (model_field) p.model_field = model_field;
            if (model_table) p.model_table = model_table
            builder.options.include.push(p);
            return builder;
        }

        builder.orderBy = (orderBy) => {
            builder.options.orderBy = orderBy;
            return builder;
        }

        builder.transaction = (transaction) => {
            builder.options.transaction = transaction;
            return builder;
        }

        builder.build = () => {
            return builder.options;
        }

        builder.execute = async () => {
            if (!builder.method) throw new Error('Method is required to execute immediately');
            return await this.adapter[builder.method](this, builder.options);
        }

        builder.executeOne = async () => {
            if (!builder.method) throw new Error('Method is required to execute immediately');
            const rows = await this.adapter[builder.method](this, builder.options);
            if (rows.length === 0) return null;
            return rows[0];
        }

        return builder;
    }
}
