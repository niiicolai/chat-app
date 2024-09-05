import mysql from 'mysql2/promise';
import BaseAdapter from './base_adapter.js';
import { query } from 'express';

/**
 * @constant pool
 * @description The MySQL pool
 */
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const queryBuilder = (model, options) => {
    const builder = { req: { query: ``, values: [] } };

    builder.count = () => {
        builder.req.query = `SELECT COUNT(*) AS count FROM ${model.mysql_table}`;
        return builder;
    }

    builder.sum = (field) => {
        builder.req.query = `SELECT SUM(${field}) AS sum FROM ${model.mysql_table}`;
        return builder;
    }

    builder.find = (options={}) => {
        builder.req.query = `SELECT`;
        for (const field in model.fields) {

            builder.req.query += ` ${model.mysql_table}.${model.fields[field]} as ${model.singularName}_${model.fields[field]},`;
        }
        builder.req.query += ` ${model.mysql_table}.${model.pk} as ${model.singularName}_${model.pk}`;
        if (model.create_timestamp) {
            builder.req.query += `, ${model.mysql_table}.${model.create_timestamp} as ${model.singularName}_${model.create_timestamp}`;
        }
        if (model.update_timestamp) {
            builder.req.query += `, ${model.mysql_table}.${model.update_timestamp} as ${model.singularName}_${model.update_timestamp}`;
        }
        if (options.include) {
            options.include.forEach(i => {
                const table = i.model_table || model.mysql_table;
                const field = i.model_field || model.pk;

                const iTable = i.model.mysql_table;
                const iField = i.field;

                for (const field in i.model.fields) {
                    builder.req.query += `, ${iTable}.${i.model.fields[field]} as ${i.model.singularName}_${i.model.fields[field]}`;
                }
                builder.req.query += `, ${iTable}.${i.model.pk} as ${i.model.singularName}_${i.model.pk}`;
                if (i.model.create_timestamp) {
                    builder.req.query += `, ${iTable}.${i.model.create_timestamp} as ${i.model.singularName}_${i.model.create_timestamp}`;
                }
                if (i.model.update_timestamp) {
                    builder.req.query += `, ${iTable}.${i.model.update_timestamp} as ${i.model.singularName}_${i.model.update_timestamp}`;
                }
            });
        }
        
        builder.req.query += ` FROM ${model.mysql_table}`;

        return builder;
    }

    builder.create = () => {
        const keys = Object.keys(options).map(k => `\`${k}\``).join(', ');
        const placeholders = Object.keys(options).map(k => '?').join(', ');

        builder.req.query = `INSERT INTO ${model.mysql_table} (${keys}) VALUES (${placeholders})`;
        builder.req.values = Object.values(options);
        return builder;
    }

    builder.update = () => {
        const keys = Object.keys(options.body).map(k => `\`${k}\` = ?`).join(', ');
        builder.req.query = `UPDATE ${model.mysql_table} SET ${keys} WHERE ${model.pk} = ?`;
        builder.req.values = Object.values(options.body);
        builder.req.values.push(options.pk);
        return builder;
    }

    builder.destroy = () => {
        builder.req.query = `DELETE FROM ${model.mysql_table} WHERE ${model.pk} = ?`;
        builder.req.values = [options.pk];
        return builder;
    }

    builder.where = (where={}) => {
        if (Object.keys(where).length > 0) {
            builder.req.query += ' WHERE ';
            builder.req.query += Object.keys(where).map(k => `${k} = ?`).join(' AND ');
            builder.req.values.push(...Object.values(where));
        }
        return builder;
    }

    builder.include = (include=[]) => {
        if (include.length > 0) {
            include.forEach(i => {
                const table = i.model_table || model.mysql_table;
                const field = i.model_field || model.pk;

                const iTable = i.model.mysql_table;
                const iField = i.field;
                
                builder.req.query += ` LEFT JOIN ${iTable} ON ${iTable}.${iField} = ${table}.${field}`;
            });
        }
        return builder;
    }

    builder.limit = (limit) => {
        if (!isNaN(limit)) {
            builder.req.query += ' LIMIT ?';
            builder.req.values.push(limit);
        }
        return builder;
    }

    builder.offset = (offset) => {
        if (!isNaN(offset)) {
            builder.req.query += ' OFFSET ?';
            builder.req.values.push(offset);
        }
        return builder;
    }

    builder.orderBy = (orderBy) => {
        if (orderBy) {
            builder.req.query += ` ORDER BY ${orderBy}`;
        }
        return builder;
    }

    builder.build = () => {
        if (process.env.DEBUG) console.log(builder.req);
        
        return builder.req;
    }

    return builder;
}

class MysqlAdapter extends BaseAdapter {
    constructor() {
        super();
    }

    async count(model, options) {
        if (!model) throw new Error('Model is required');
        if (!model.mysql_table) throw new Error('Model mysql_table is required');
        if (!model.pk) throw new Error('Model pk is required');
        if (!options) throw new Error('Options are required');

        const req = queryBuilder(model, options)
            .count()
            .include(options.include)
            .where(options.where)
            .build();

        const [rows] = await pool.query(req.query, req.values);
        return rows[0].count;
    }

    async sum(model, options) {
        if (!model) throw new Error('Model is required');
        if (!model.mysql_table) throw new Error('Model mysql_table is required');
        if (!model.pk) throw new Error('Model pk is required');
        if (!options) throw new Error('Options are required');
        if (!options.field) throw new Error('Field is required');

        const req = queryBuilder(model, options)
            .sum(options.field)
            .include(options.include)
            .where(options.where)
            .build();

        const [rows] = await pool.query(req.query, req.values); 
        const sumJson = rows[0].sum;
        const parsedInt = parseInt(sumJson);
        return parsedInt;
    }

    async findAll(model, options) {
        if (!model) throw new Error('Model is required');
        if (!model.mysql_table) throw new Error('Model mysql_table is required');
        if (!options) throw new Error('Options are required');

        const req = queryBuilder(model, options)
            .find(options)
            .include(options.include)
            .where(options.where)
            
            .orderBy(options.orderBy)
            .limit(options.limit)
            .offset(options.offset)
            .build();

        const [rows] = await pool.query(req.query, req.values);
        return rows;
    }

    async findOne(model, options) {
        if (!model) throw new Error('Model is required');
        if (!model.mysql_table) throw new Error('Model mysql_table is required');
        if (!model.pk) throw new Error('Model pk is required');
        if (!options) throw new Error('Options are required');
        if (!options.pk) throw new Error('Primary key is required');

        const req = queryBuilder(model, options)
            .find(options)
            .include(options.include)
            .where({ [`${model.mysql_table}.${model.pk}`]: options.pk })
            .build();

        const [rows] = await pool.query(req.query, req.values);
        return rows[0];
    }

    async findOneByField(model, options) {
        if (!model) throw new Error('Model is required');
        if (!model.mysql_table) throw new Error('Model mysql_table is required');
        if (!options) throw new Error('Options are required');
        if (!options.fieldName) throw new Error('Field name is required');
        if (!options.fieldValue) throw new Error('Field value is required');

        const req = queryBuilder(model, options)
            .find(options)
            .include(options.include)
            .where({ ...options.where, [options.fieldName]: options.fieldValue })
            .build();

        const [rows] = await pool.query(req.query, req.values);
        return rows[0];
    }

    async create(model, options) {
        if (!model) throw new Error('Model is required');
        if (!model.mysql_table) throw new Error('Model mysql_table is required');
        if (!options) throw new Error('Options are required');

        options.created_at = new Date();
        options.updated_at = new Date();

        const req = queryBuilder(model, options)
            .create()
            .build();

        await pool.query(req.query, req.values);
    }

    async update(model, options) {
        if (!model) throw new Error('Model is required');
        if (!model.mysql_table) throw new Error('Model mysql_table is required');
        if (!model.pk) throw new Error('Model pk is required');
        if (!options) throw new Error('Options are required');
        if (!options.pk) throw new Error('Primary key is required');
        if (!options.body) throw new Error('Body is required');

        const req = queryBuilder(model, options)
            .update()
            .build();

        await pool.query(req.query, req.values);
    }

    async destroy(model, options) {
        if (!model) throw new Error('Model is required');
        if (!model.mysql_table) throw new Error('Model mysql_table is required');
        if (!model.pk) throw new Error('Model pk is required');
        if (!options) throw new Error('Options are required');
        if (!options.pk) throw new Error('Primary key is required');

        const req = queryBuilder(model, options)
            .destroy()
            .build();

        await pool.query(req.query, req.values);
    }
}

const adapter = new MysqlAdapter();

export default adapter;
