import { CronJob } from 'cron';
import { exec } from 'child_process';
import path from 'path';
import rollbar from '../../../rollbar.js';

// Run once a day
const cronTime = '* * * * * *';

// Copenhagen timezone
const timeZone = 'Europe/Copenhagen';

// Neo4j backup directory
const backupDir = process.env.NEO4J_BACKUP_LOCATION;

// Define database name and credentials
const dbName = process.env.NEO4J_DATABASE;
const neo4jHomeDir = process.env.NEO4J_HOME || '/var/lib/neo4j';

// Job
const onTick = async () => {
    console.log(`NEO4J_BACKUP: ${Date.now()}: Starting Neo4j backup`);

    try {
        const unixTimestamp = Math.floor(Date.now() / 1000);
        const dumpFileName = path.resolve(backupDir);

        console.log(`Dump file will be saved to: ${dumpFileName}`);

        const neo4jDumpCommand = `"${neo4jHomeDir}/bin/neo4j-admin" database dump ${dbName} --to-path=${dumpFileName} --verbose`;
        exec(neo4jDumpCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error creating dump: ${error.message}`);
                return;
            }

            if (stderr) {
                console.error(`neo4j-admin dump stderr: ${stderr}`);
                return;
            }

            console.log(`NEO4J_BACKUP: ${Date.now()}: Finished Neo4j backup`);
        });
    } catch (error) {
        rollbar.error(error);
        console.error(`NEO4J_BACKUP: ${Date.now()}: Error during Neo4j backup: ${error.message}`);
    }
};

CronJob.from({ cronTime, onTick, start: true, timeZone });
