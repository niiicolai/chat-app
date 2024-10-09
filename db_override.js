import 'dotenv/config'
import { exec } from 'child_process';
import { execute as seedMongoDB } from './src/document-based/mongoose/seeders/seed_all.js';

async function migrateAndSeedMySQL() {
    const dbConfig = {
        username: process.env.ROOT_MYSQL_USER,
        password: process.env.ROOT_MYSQL_PASSWORD,
        host: process.env.ROOT_MYSQL_HOST,
        database: process.env.ROOT_MYSQL_DATABASE,
        port: process.env.ROOT_MYSQL_PORT || 3306,
    };

    const mysqlScript = './MySQL_Script.sql';
    const mysqlCommand = `mysql --user=${dbConfig.username} --password=${dbConfig.password} --host=${dbConfig.host} --port=${dbConfig.port} ${dbConfig.database} < ${mysqlScript}`;
    exec(mysqlCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing SQL script: ${error.message}`);
            return;
        }

        if (stderr) {
            console.error(`MySQL stderr: ${stderr}`);
            return;
        }

        console.log(`Successfully executed SQL script: ${stdout}`);
    });
}

migrateAndSeedMySQL();
seedMongoDB('down');
seedMongoDB('up');
