import { CronJob } from 'cron';
import { exec } from 'child_process';
import path from 'path';
import rollbar from '../../../rollbar.js';

/**
 * MongoDB Backup job.
 * The job is responsible for creating a backup of the MongoDB database.
 */

// Run once a day
const cronTime = '0 0 0 * * *';

// Copenhagen timezone
const timeZone = 'Europe/Copenhagen';

// MongoDB backup directory
const backupDir = process.env.MONGO_BACKUP_LOCATION;
if (!backupDir) console.warn('MONGO_BACKUP_LOCATION is not set in .env');

// Define connection string
const env = process.env.NODE_ENV || 'development';
const e = { development: 'DEV', test: 'TEST', production: 'PROD' };
const connectionString = process.env[`MONGO_${e[env]}_DATABASE_URL`];
if (!connectionString) console.warn(`MONGO_${e[env]}_DATABASE_URL is not set in .env`);

/**
 * @function createDump
 * @description Create a MongoDB dump.
 * @returns {Promise<void>}
 */
export const createDump = async () => {
    const unixTimestamp = Math.floor(Date.now() / 1000);
    const dumpFileName = path.resolve(backupDir, `backup_${unixTimestamp}`);
    const mongodbdumpCommand = `mongodump --uri="${connectionString}" --out="${dumpFileName}"`;
    console.log(`Dump file will be saved to: ${dumpFileName}`);

    await new Promise((resolve, reject) => {
        exec(mongodbdumpCommand, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                console.error(`Error creating dump: ${error.message}`);
                return;
            }

            if (stderr) {
                console.error(`mongodump stderr: ${stderr}`);
                return;
            }

            console.log(`MONGODB_BACKUP: ${Date.now()}: Finished MongoDB backup`);
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
    console.log(`MONGODB_BACKUP: ${Date.now()}: Starting MongoDB backup`);

    try {
        await createDump();
        console.log(`MONGODB_BACKUP: ${Date.now()}: Finished MongoDB backup`);
    } catch (error) {
        rollbar.error(error);
        console.error(`MONGODB_BACKUP: ${Date.now()}: Error during MongoDB backup: ${error.message}`);
    }
};

// Create a cron job
CronJob.from({ cronTime, onTick, start: true, timeZone });
