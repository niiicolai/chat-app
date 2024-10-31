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

/**
 * Error creating dump: Command failed: "C:/Program Files/neo4j-community-5.24.2/bin/neo4j-admin" database dump neo4j --to-path=C:\Users\niiic\Desktop\backups --verbose
org.neo4j.cli.CommandFailedException: Dump failed for databases: 'neo4j'
        at org.neo4j.commandline.dbms.DumpCommand.execute(DumpCommand.java:191)
        at org.neo4j.cli.AbstractCommand.call(AbstractCommand.java:92)
        at org.neo4j.cli.AbstractCommand.call(AbstractCommand.java:37)
        at picocli.CommandLine.executeUserObject(CommandLine.java:2045)
        at picocli.CommandLine.access$1500(CommandLine.java:148)

    Create a read only replica of the database and dump that instead.
 */

//CronJob.from({ cronTime, onTick, start: true, timeZone });
