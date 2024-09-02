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
 * @param {String} pluralName The plural name of the resource
 * @returns {Number} The number of records
 */
manager.count = async function (pluralName) {
    const query = `SELECT COUNT(*) AS count FROM ?`;
    const [rows] = await this.pool.query(query, [pluralName]);
    return rows[0].count;
}

/**
 * @function findAll
 * @description Find all records
 * @param {String} pluralName The plural name of the resource
 * @param {Number} limit The number of records to return
 * @param {Number} offset The number of records to skip
 * @returns {Array} An array of records
 */
manager.findAll = async function (pluralName, limit = 10, offset = 0) {
    const query = `SELECT * FROM ? LIMIT ? OFFSET ?`;
    const [rows] = await this.pool.query(query, [pluralName, limit, offset]);
    return rows;
}

/**
 * @function findOne
 * @description Find one record
 * @param {String} pluralName The plural name of the resource
 * @param {String} pk The primary key
 * @param {String} pkValue The primary key value
 * @returns {object} The record
 */
manager.findOne = async function (pluralName, pk, pkValue) {
    const query = `SELECT * FROM ? WHERE ? = ?`;
    const [rows] = await this.pool.query(query, [pluralName, pk, pkValue]);
    return rows[0];
}

/**
 * @function create
 * @description Create a record
 * @param {String} pluralName The plural name of the resource
 * @param {Object} data The data to create
 * @returns {undefined}
 */
manager.create = async function (pluralName, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const query = `INSERT INTO ? (?) VALUES (?)`;
    await this.pool.query(query, [pluralName, keys, values]);
}

/**
 * @function update
 * @description Update a record
 * @param {String} pluralName The plural name of the resource
 * @param {Object} data The data to update
 * @param {String} pk The primary key
 * @param {String} pkValue The primary key value
 * @returns {undefined}
 */
manager.update = async function (pluralName, data, pk, pkValue) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const query = `UPDATE ? SET ? WHERE ? = ?`;
    await this.pool.query(query, [pluralName, keys, pk, pkValue]);
}

/**
 * @function destroy
 * @description Destroy a record
 * @param {String} pluralName The plural name of the resource
 * @param {String} pk The primary key
 * @param {String} pkValue The primary key value
 * @returns {undefined}
 */
manager.destroy = async function (pluralName, pk, pkValue) {
    const query = `DELETE FROM ? WHERE ? = ?`;
    await this.pool.query(query, [pluralName, pk, pkValue]);
}

// export manager
export default manager;
