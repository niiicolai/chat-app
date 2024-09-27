import 'dotenv/config'
import { exec } from 'child_process';

// Parse the connection string
const dbConfig = {
    username: process.env.ROOT_MYSQL_USER,
    password: process.env.ROOT_MYSQL_PASSWORD,
    host: process.env.ROOT_MYSQL_HOST,
    database: process.env.ROOT_MYSQL_DB,
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