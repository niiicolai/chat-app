import { CronJob } from 'cron';
import { exec } from 'child_process';
import path from 'path';
import rollbar from '../../../rollbar.js';

// Run once a day
const cronTime = '0 0 0 * * *';

// Copenhagen timezone
const timeZone = 'Europe/Copenhagen';

// MongoDB backup directory
const backupDir = process.env.MONGO_BACKUP_LOCATION;

// Define connection string
const env = process.env.NODE_ENV || 'development';
const e = { development: 'DEV', production: 'PROD' };
const connectionString = process.env[`MONGO_${e[env]}_DATABASE_URL`];

// Job
const onTick = async () => {
    console.log(`MONGODB_BACKUP: ${Date.now()}: Starting MongoDB backup`);

    try {
        const unixTimestamp = Math.floor(Date.now() / 1000);
        const dumpFileName = path.resolve(backupDir, `backup_${unixTimestamp}`);

        console.log(`Dump file will be saved to: ${dumpFileName}`);

        const mongodbdumpCommand = `mongodump --uri="${connectionString}" --out="${dumpFileName}"`;
        exec(mongodbdumpCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error creating dump: ${error.message}`);
                return;
            }

            if (stderr) {
                console.error(`mongodump stderr: ${stderr}`);
                return;
            }

            console.log(`MONGODB_BACKUP: ${Date.now()}: Finished MongoDB backup`);
        });

        console.log(`MONGODB_BACKUP: ${Date.now()}: Finished MongoDB backup`);
    } catch (error) {
        rollbar.error(error);
        console.error(`MONGODB_BACKUP: ${Date.now()}: Error during MongoDB backup: ${error.message}`);
    }
};

CronJob.from({ cronTime, onTick, start: true, timeZone });
