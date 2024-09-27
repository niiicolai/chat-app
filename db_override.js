import 'dotenv/config'
import { exec } from 'child_process';

// Load MySQL connection details from environment variables
const env = process.env.NODE_ENV || 'development';
const e = { development: 'DEV', production: 'PROD' };
const connectionString = process.env[`SEQUELIZE_ROOT_${e[env]}_DATABASE_URL`];

// Parse the connection string
const dbConfig = {
    username: connectionString.split(':')[1].split('//')[1],
    password: connectionString.split(':')[2].split('@')[0],
    host: connectionString.split('@')[1].split(':')[0],
    database: connectionString.split('/')[3],
};

const mysqlScript = './MySQL_Script.sql';

async function migrateDBFromScript() {
    const mysqlCommand = `mysql --user=${dbConfig.username} --password=${dbConfig.password} --host=${dbConfig.host} ${dbConfig.database} < ${mysqlScript}`;

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

migrateDBFromScript();