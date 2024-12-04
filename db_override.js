import 'dotenv/config'

import { exec } from 'child_process';
import { overrideMySQL } from './src/relational-based/scripts/mysql_override.js';
import { execute as seedMongoDB } from './src/document-based/mongoose/seeders/seed_all.js';
import { execute as seedNeo4j } from './src/graph-based/scripts/seed_all.js';

(async () => {
    await overrideMySQL();
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
    
    await seedMongoDB('up');
    await seedNeo4j('up');
    process.exit(0);
})();
