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
