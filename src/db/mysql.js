import BaseAdapter from './base_adapter.js';
import Builder from './mysql/builder.js';
import pool from './mysql/pool.js';

/**
 * @class MysqlAdapter
 * @description Mysql adapter
 * @extends BaseAdapter
 * @requires BaseAdapter
 * @requires Builder
 * @requires pool
 */
export default class MysqlAdapter extends BaseAdapter {
    constructor(model) {
        super(model);
        this.builder = new Builder(model);        
    }

    /**
     * @function transaction
     * @description Executes a transaction
     * @param {function} callback
     * @returns {Promise<void>}
     */
    async transaction(callback) {
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        if (process.env.DEBUG === 'true') 
            console.log('TRANSACTION STARTED;');
        
        try {
            await callback(connection);
            await connection.commit();
            if (process.env.DEBUG === 'true') 
                console.log('COMMIT;');
        } catch (error) {
            await connection.rollback();
            if (process.env.DEBUG === 'true') 
                console.log(`ROLLBACK: ${error.message};`);
            throw error;
        } finally {
            connection.release();
            if (process.env.DEBUG === 'true') 
                console.log('CONNECTION RELEASED;');
        }
    }

    /**
     * @function count
     * @description Counts the number of rows
     * @param {Object} options
     * @returns {Promise<number>}
     */
    async count(options) {        
        if (!options) throw new Error('Options are required');
        const [ rows ] = await this.builder
            .setOptions(options)
            .count()
            .include()
            .where()
            .execute();
        
        return parseInt(rows[0].count || 0);
    }

    /**
     * @function sum
     * @description Sums the field
     * @param {Object} options
     * @returns {Promise<number>}
     */
    async sum(options) {
        if (!options) throw new Error('Options are required');
        if (!options.field) throw new Error('Field is required');

        const [rows] = await this.builder
            .setOptions(options)
            .sum()
            .include()
            .where()
            .execute();
                
        return parseInt(rows[0].sum || 0);
    }

    /**
     * @function func
     * @description Executes a db function
     * @param {Object} options
     * @returns {Promise}
     */
    async func(options) {
        if (!options) throw new Error('func: Options are required');
        if (!options.func) throw new Error('func: options.func is required');
        if (typeof options.args !== 'object') 
            throw new Error('func: options.arguments is required');

        return await this.builder
            .setOptions(options)
            .func()
            .execute();
    }

    /**
     * @function procedure
     * @description Executes a db procedure
     * @param {Object} options
     * @returns {Promise}
     */
    async procedure(options) {
        if (!options) throw new Error('procedure: Options are required');
        if (!options.procedure) throw new Error('procedure: options.procedure is required');
        if (typeof options.args !== 'object') 
            throw new Error('procedure: options.arguments is required');

        await this.builder
            .setOptions(options)
            .callProcedure()
            .execute();

        const [ rows ] =  await this.builder
            .setOptions(options)
            .selectProcedure()
            .execute();
            
        if (rows.length === 0) return null;

        return rows[0].result;
    }

    /**
     * @function find
     * @description Finds rows
     * @param {Object} options
     * @returns {Promise<Array>}
     */
    async find(options) {
        if (!options) throw new Error('Options are required');        
        const [rows] = await this.builder
            .setOptions(options)
            .find()
            .include()
            .where()            
            .orderBy()
            .limit()
            .offset()
            .execute();

        return rows;
    }

    /**
     * @function create
     * @description Creates a row
     * @param {Object} options
     * @returns {Promise<void>}
     */
    async create(options={}) {
        if (!options) throw new Error('Options are required');

        options.body.created_at = new Date();
        options.body.updated_at = new Date();

        await this.builder
            .setOptions(options)
            .create()
            .execute();
    }

    /**
     * @function update
     * @description Updates a row
     * @param {Object} options
     * @returns {Promise<void>}
     */
    async update(options={}) {
        if (!options) throw new Error('Options are required');
        if (!options.where) throw new Error('Where is required');
        if (!options.body) throw new Error('Body is required');

        options.body.updated_at = new Date();

        await this.builder
            .setOptions(options)
            .update()
            .include()
            .where()
            .execute();
    }

    /**
     * @function destroy
     * @description Destroys a row
     * @param {Object} options
     * @returns {Promise<void>}
     */
    async destroy(options={}) {
        if (!options) throw new Error('Options are required');
        if (!options.where) throw new Error('Where is required');

        await this.builder
            .setOptions(options)
            .destroy()
            .include()
            .where()
            .execute();
    }
}
