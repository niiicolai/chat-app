import { CronJob } from 'cron';
import { exec } from 'child_process';
import path from 'path';
import rollbar from '../../rollbar.js';

// Run once a day
const cronTime = '0 0 0 * * *';

// Copenhagen timezone
const timeZone = 'Europe/Copenhagen';

// MySQL backup directory
const backupDir = process.env.MYSQL_BACKUP_LOCATION;

// Define connection string
const env = process.env.NODE_ENV || 'development';
const e = { development: 'DEV', production: 'PROD' };
const connectionString = process.env[`SEQUELIZE_ADMIN_${e[env]}_DATABASE_URL`];
const dbUrl = new URL(connectionString);
const dbConfig = {
    username: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.replace('/', ''),
    host: dbUrl.hostname,
    port: dbUrl.port || 3306,
};

// Job
const onTick = async () => {
    console.log(`MYSQL_BACKUP: ${Date.now()}: Starting MySQL backup`);

    try {
        const unixTimestamp = Math.floor(Date.now() / 1000);
        const dumpFileName = path.resolve(backupDir, `backup_${unixTimestamp}.sql`);

        console.log(`Dump file will be saved to: ${dumpFileName}`);

        const mysqldumpCommand = `mysqldump --user=${dbConfig.username} --password=${dbConfig.password} --host=${dbConfig.host} --port=${dbConfig.port} --no-tablespaces ${dbConfig.database} > ${dumpFileName}`;
        exec(mysqldumpCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error creating dump: ${error.message}`);
                return;
            }

            if (stderr) {
                console.error(`mysqldump stderr: ${stderr}`);
                return;
            }

            console.log(`MYSQL_BACKUP: ${Date.now()}: Finished MySQL backup`);
        });

        console.log(`MYSQL_BACKUP: ${Date.now()}: Finished MySQL backup`);
    } catch (error) {
        rollbar.error(error);
        console.error(`MYSQL_BACKUP: ${Date.now()}: Error during MySQL backup: ${error.message}`);
    }
};

CronJob.from({ cronTime, onTick, start: true, timeZone });
