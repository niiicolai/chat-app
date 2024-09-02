import mysql from 'mysql2/promise';

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

/**
 * @constant manager
 * @description The manager object
 */
const manager = { pool };

/**
 * @function count
 * @description Count the number of records
 * @param {String} model The model
 * @returns {Number} The number of records
 */
manager.count = async function (model, where={}) {
    const values = [];
    let query = `SELECT COUNT(*) AS count FROM ${model.mysql_table}`;
    if (Object.keys(where).length > 0) {
        query += ' WHERE ';
        query += Object.keys(where).map(k => `\`${k}\` = ?`).join(' AND ');
        values.push(...Object.values(where));
    }
    const [rows] = await this.pool.query(query, values);
    return rows[0].count;
}

/**
 * @function findAll
 * @description Find all records
 * @param {String} model The model
 * @param {Number} limit The number of records to return
 * @param {Number} offset The number of records to skip
 * @returns {Array} An array of records
 */
manager.findAll = async function (model, limit = 10, offset = 0, where={}) {
    const values = [limit, offset];
    let query = `SELECT * FROM ${model.mysql_table} LIMIT ? OFFSET ?`;
    if (Object.keys(where).length > 0) {
        query += ' WHERE ';
        query += Object.keys(where).map(k => `\`${k}\` = ?`).join(' AND ');
        values.push(...Object.values(where));
    }
    
    const [rows] = await this.pool.query(query, values);
    return rows;
}

/**
 * @function findOne
 * @description Find one record
 * @param {String} model The model
 * @param {String} pk The primary key
 * @param {String} pkValue The primary key value
 * @returns {object} The record
 */
manager.findOne = async function (model, pkValue) {
    const query = `SELECT * FROM ${model.mysql_table} WHERE ${model.pk} = ?`;
    const [rows] = await this.pool.query(query, [pkValue]);
    return rows[0];
}

manager.findOneByField = async function (model, fieldName, fieldValue) {
    const query = `SELECT * FROM ${model.mysql_table} WHERE ${fieldName} = ?`;
    const [rows] = await this.pool.query(query, [fieldValue]);
    return rows[0];
}

/**
 * @function create
 * @description Create a record
 * @param {String} model The model
 * @param {Object} data The data to create
 * @returns {undefined}
 */
manager.create = async function (model, data) {
    const keys = Object.keys(data).map(k => `\`${k}\``).join(', ');
    const values = Object.values(data);
    const query = `INSERT INTO ${model.mysql_table} (${keys}) VALUES (?)`;
    await this.pool.query(query, [values]);
}

/**
 * @function update
 * @description Update a record
 * @param {String} model The model
 * @param {Object} data The data to update
 * @param {String} pk The primary key
 * @param {String} pkValue The primary key value
 * @returns {undefined}
 */
manager.update = async function (model, data, pk, pkValue) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const query = `UPDATE ${model.mysql_table} SET ? WHERE ? = ?`;
    await this.pool.query(query, [keys, pk, pkValue]);
}

/**
 * @function destroy
 * @description Destroy a record
 * @param {String} model The model
 * @param {String} pk The primary key
 * @param {String} pkValue The primary key value
 * @returns {undefined}
 */
manager.destroy = async function (model, pk, pkValue) {
    const query = `DELETE FROM ${model.mysql_table} WHERE ? = ?`;
    await this.pool.query(query, [pk, pkValue]);
}

// export manager
export default manager;
