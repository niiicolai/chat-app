import mysql from 'mysql2/promise';

/**
 * @constant pool
 * @description The MySQL pool
 */
const pool = mysql.createPool({
    host: process.env.NODE_MYSQL_HOST,
    port: process.env.NODE_MYSQL_PORT,
    user: process.env.NODE_MYSQL_USER,
    password: process.env.NODE_MYSQL_PASSWORD,
    database: process.env.NODE_MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool;