import 'dotenv/config'
import { overrideMySQL } from './mysql_override.js';
import { execute as seedMongoDB } from './src/document-based/mongoose/seeders/seed_all.js';
import { execute as seedNeo4j } from './src/graph-based/neode/seeders/seed_all.js';

overrideMySQL();
seedMongoDB('down').then(() => seedMongoDB('up'));
seedNeo4j('down').then(() => seedNeo4j('up'));
