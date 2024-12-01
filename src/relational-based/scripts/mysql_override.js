import 'dotenv/config'
import path from 'path';
import { exec } from 'child_process';

export async function overrideMySQL() {
    const dbConfig = {
        username: process.env.ROOT_MYSQL_USER,
        password: process.env.ROOT_MYSQL_PASSWORD,
        host: process.env.ROOT_MYSQL_HOST,
        database: process.env.ROOT_MYSQL_DATABASE,
        port: process.env.ROOT_MYSQL_PORT || 3306,
    };

    if (!dbConfig.username) console.error('ROOT_MYSQL_USER is not set in .env');
    if (!dbConfig.password) console.error('ROOT_MYSQL_PASSWORD is not set in .env');
    if (!dbConfig.host) console.error('ROOT_MYSQL_HOST is not set in .env');
    if (!dbConfig.database) console.error('ROOT_MYSQL_DATABASE is not set in .env');

    const dir = path.resolve('src', 'relational-based', 'scripts');
    const mysqlScript = path.join(dir, 'MySQL_Script.sql');
    
    const mysqlCommand = `mysql --user=${dbConfig.username} --password=${dbConfig.password} --host=${dbConfig.host} --port=${dbConfig.port} ${dbConfig.database} < ${mysqlScript}`;
    
    return new Promise((resolve, reject) => {
        exec(mysqlCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing SQL script: ${error.message}`);
                reject(error);
            }
    
            if (stderr) {
                console.error(`MySQL stderr: ${stderr}`);
            }
    
            console.log(`Successfully executed SQL script: ${mysqlScript}`);
            resolve(stdout);
        });
    });
}

if (process.argv.includes('--run')) {
    overrideMySQL();
}
