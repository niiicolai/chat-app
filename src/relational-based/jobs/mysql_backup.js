import { CronJob } from 'cron';
import { exec } from 'child_process';
import path from 'path';
import rollbar from '../../../rollbar.js';

/**
 * MySQL Backup job.
 * The job is responsible for creating a backup of the MySQL database.
 */

// Run once a day
const cronTime = '0 0 0 * * *';

// Copenhagen timezone
const timeZone = 'Europe/Copenhagen';

// MySQL backup directory
const backupDir = process.env.MYSQL_BACKUP_LOCATION;
if (!backupDir) console.warn('MYSQL_BACKUP_LOCATION is not set in .env');

// Define connection string
const env = process.env.NODE_ENV || 'development';
const e = { development: 'DEV', test: 'TEST', production: 'PROD' };
const connectionString = process.env[`SEQUELIZE_ADMIN_${e[env]}_DATABASE_URL`];
if(!connectionString) console.warn(`SEQUELIZE_ADMIN_${e[env]}_DATABASE_URL is not set in .env`);

// Parse connection string
const dbUrl = new URL(connectionString);
const dbConfig = {
    username: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.replace('/', ''),
    host: dbUrl.hostname,
    port: dbUrl.port || 3306,
};

/**
 * @function createDump
 * @description Create a MySQL dump.
 * @returns {Promise<void>}
 */
export const createDump = async () => {
    const unixTimestamp = Math.floor(Date.now() / 1000);
    const dumpFileName = path.resolve(backupDir, `backup_${unixTimestamp}.sql`);
    const mysqldumpCommand = `mysqldump --user=${dbConfig.username} --password=${dbConfig.password} --host=${dbConfig.host} --port=${dbConfig.port} --no-tablespaces ${dbConfig.database} > ${dumpFileName}`;
    console.log(`Dump file will be saved to: ${dumpFileName}`);

    await new Promise((resolve, reject) => {
        exec(mysqldumpCommand, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                console.error(`Error creating dump: ${error.message}`);
                return;
            }

            if (stderr) {
                console.error(`mysqldump stderr: ${stderr}`);
                return;
            }

            console.log(`MYSQL_BACKUP: ${Date.now()}: Finished MySQL backup`);
            resolve();
        });
    });
}

/**
 * @function onTick
 * @description The function to run on tick.
 * @returns {Promise<void>}
 */
const onTick = async () => {
    console.log(`MYSQL_BACKUP: ${Date.now()}: Starting MySQL backup`);

    try {
        await createDump();
        console.log(`MYSQL_BACKUP: ${Date.now()}: Finished MySQL backup`);
    } catch (error) {
        rollbar.error(error);
        console.error(`MYSQL_BACKUP: ${Date.now()}: Error during MySQL backup: ${error.message}`);
    }
};

// Create a cron job
CronJob.from({ cronTime, onTick, start: true, timeZone });
