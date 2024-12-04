import 'dotenv/config';
import './src/document-based/mongoose/index.js';
import './src/graph-based/neode/index.js';

import { exec } from 'child_process';
import { overrideMySQL } from './src/relational-based/scripts/mysql_override.js';
import { execute as seedMongoDB } from './src/document-based/mongoose/seeders/seed_all.js';
import { execute as seedNeo4j } from './src/graph-based/scripts/seed_all.js';

export async function setup({ provide }) {
    console.log('=== Global Test Setup ===');
    console.log('Restore MySQL database');
    await overrideMySQL(); // Builds the MySQL database from the schema file.
    await new Promise((resolve) => { // Seeds the MySQL database.
        exec('npm run sequelize:seed', (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            resolve();
        });
    });

    console.log('Restore MongoDB');
    await seedMongoDB('up');

    console.log('Restore Neo4j');
    await seedNeo4j('up');
    
    console.log('=== Global Test Setup Completed ===');
}
