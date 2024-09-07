
import BaseAdapter from './base_adapter.js';
import Builder from './mysql/builder.js';
import pool from './mysql/pool.js';

export default class MysqlAdapter extends BaseAdapter {
    constructor(model) {
        super(model);        
        this.builder = new Builder(model);        
    }

    async transaction(callback) {
        const connection = await pool.getConnection();
        await callback(connection);
        await connection.beginTransaction();
        try {
            
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

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

    async create(options={}) {
        if (!options) throw new Error('Options are required');

        options.created_at = new Date();
        options.updated_at = new Date();

        await this.builder
            .setOptions(options)
            .create()
            .execute();
    }

    async update(options={}) {
        if (!options) throw new Error('Options are required');
        if (!options.where) throw new Error('Where is required');
        if (!options.body) throw new Error('Body is required');

        options.updated_at = new Date();

        await this.builder
            .setOptions(options)
            .update()
            .where()
            .execute();
    }

    async destroy(options={}) {
        if (!options) throw new Error('Options are required');
        if (!options.where) throw new Error('Where is required');

        await this.builder
            .setOptions(options)
            .destroy()
            .where()
            .build();
    }
}
