import pool from './pool.js';

export default class Builder {
    constructor(model) {
        if (!model) throw new Error('model is required');
        if (!model.mysql_table) throw new Error('Model mysql_table is required');
        if (!model.fields) throw new Error('Fields are required');
        if (!model.singularName) throw new Error('Singular name is required');
        if (!model.pk) throw new Error('Primary key is required');

        this.pk = model.pk;        
        this.fields = model.fields;
        this.table = model.mysql_table;        
        this.singularName = model.singularName;  
        this.create_timestamp = model.create_timestamp;
        this.update_timestamp = model.update_timestamp;   
        this.req = { query: ``, values: [] };   
        this.options = {};
    }

    setOptions(options) {
        this.options = options;
        this.req.values = [];
        this.req.query = '';
        return this;
    }

    count () {        
        this.req.query = `SELECT COUNT(*) AS count FROM ${this.table}`;
        return this;
    }

    sum() {
        const field = this.options.field;
        if (!field) throw new Error('sum: options.field is required');
        
        this.req.query = `SELECT SUM(${field}) AS sum FROM ${this.table}`;
        return this;
    }

    find() {
        this.req.query = `SELECT`;

        const localFields = [
            ...this.fields,
            this.pk
        ];

        if (this.create_timestamp) 
            localFields.push(this.create_timestamp);
        
        if (this.update_timestamp) 
            localFields.push(this.update_timestamp);

        for (const field in localFields) {
            const f = localFields[field];
            const prefix = this.singularName;
            this.req.query += ` ${this.table}.${f} as ${prefix}_${f},`;
        }
        this.req.query = this.req.query.slice(0, -1);
        
        if (this.options.include) {
            this.options.include.forEach(i => {
                const iTable = i.model.mysql_table;
                const prefix = i.model.singularName;
                const localFields = [
                    ...i.model.fields,
                    i.model.pk,
                ];
                if (i.model.create_timestamp) 
                    localFields.push(i.model.create_timestamp);
                if (i.model.update_timestamp)
                    localFields.push(i.model.update_timestamp);

                for (const field in localFields) {
                    const f = localFields[field];
                    this.req.query += `, ${iTable}.${f} as ${prefix}_${f}`;
                }                
            });
        }
        
        this.req.query += ` FROM ${this.table}`;

        return this;
    }

    create() {
        if (!this.options.body) throw new Error('create: options.body is required');

        const body = this.options.body;
        const keys = Object.keys(body).map(k => `\`${k}\``).join(', ');
        const placeholders = Object.keys(body).map(k => '?').join(', ');

        this.req.query = `INSERT INTO ${this.table} (${keys}) VALUES (${placeholders})`;
        this.req.values = Object.values(body);
        return this;
    }

    update() {
        if (!this.options.body) throw new Error('update: options.body is required');
        if (!this.options.where) throw new Error('Security risk: Blocked update without where clause');

        const body = this.options.body;
        const keys = Object.keys(body).map(k => `\`${k}\` = ?`).join(', ');
        this.req.query = `UPDATE ${this.table} SET ${keys}`;
        this.req.values = Object.values(body);
        return this;
    }

    destroy() {
        if (!this.options.where) throw new Error('Security risk: Blocked delete without where clause');

        this.req.query = `DELETE ${this.table} FROM ${this.table}`;
        return this;
    }

    where() {
        const where = this.options.where || {};
        const keys = Object.keys(where);
        if (keys.length > 0) {
            this.req.query += ' WHERE ';
            this.req.query += keys.map(k => `${k} ${where[k].operator || '='} ?`).join(' AND ');
            this.req.values.push(...keys.map(k => where[k].value));                    
        }
        return this;
    }

    include() {
        const include = this.options.include || [];
        if (include.length > 0) {
            include.forEach(i => {
                const table = i.model_table || this.table;
                const field = i.model_field || this.pk;

                const iTable = i.model.mysql_table;
                const iField = i.field;
                
                this.req.query += ` LEFT JOIN ${iTable} ON ${iTable}.${iField} = ${table}.${field}`;
            });
        }
        return this;
    }

    limit() {
        const limit = this.options.limit;
        if (!isNaN(limit) && limit > 0) {
            this.req.query += ' LIMIT ?';
            this.req.values.push(limit);
        }
        return this;
    }

    offset = () => {
        const offset = this.options.offset;
        if (!isNaN(offset) && offset >= 0 && offset !== -0) {
            this.req.query += ' OFFSET ?';
            this.req.values.push(offset);
        }
        return this;
    }

    orderBy = () => {
        const orderBy = this.options.orderBy;
        if (orderBy) {
            this.req.query += ` ORDER BY ${orderBy}`;
        }
        return this;
    }

    build() {
        if (process.env.DEBUG) console.log(this.req);        
        return this.req;
    }

    async execute() {
        const req = this.build();
        if (this.options.transaction !== undefined) {
            return await this.options.transaction.query(req.query, req.values);
        } else {
            return await pool.query(req.query, req.values);
        }
    }
}
