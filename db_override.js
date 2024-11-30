import 'dotenv/config'
import { overrideMySQL } from './src/relational-based/scripts/mysql_override.js';
import { execute as seedMongoDB } from './src/document-based/mongoose/seeders/seed_all.js';
import { execute as seedNeo4j } from './src/graph-based/scripts/seed_all.js';

(async () => {
    await overrideMySQL();
    await seedMongoDB('down');
    await seedMongoDB('up');
    await seedNeo4j('up');
    process.exit(0);
})();
