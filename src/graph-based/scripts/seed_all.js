import 'dotenv/config'
import fs from "fs";
import path from "path";
import { pathToFileURL } from 'url';
import instance from '../neode/index.js';
import ChannelSeeder from '../neode/seeders/channel.js';

export const execute = async (command) => {
    const now = new Date();
    console.log(`\n\nNEO4J - ${command.toUpperCase()}:`);
    console.log(`${now} - Executing ${command} on all seeders`);

    // Clear all data
    if (command === 'up') {
        console.log(`${now} - Clearing all data`);
        const session = instance.driver.session();
        await session.run('MATCH (n) DETACH DELETE n');
        session.close();
    }

    console.log(`${now} - Running cypher scripts`);
    const scriptsDir = path.resolve('src', 'graph-based', 'scripts');
    fs.readdirSync(scriptsDir).forEach(file => {
        if (!file.endsWith('.cypher')) {
            return;
        }
        try {
            const fileDir = path.join(scriptsDir, file);
            const filePath = pathToFileURL(fileDir);
            // Import file as text
            const text = fs.readFileSync(fileDir, 'utf8');
            // Split text into individual queries by semicolon
            const queries = text.split(';')
                .map(query => query.trim())
                .filter(query => query.length > 0);

            // Execute each query
            instance.batch(queries.map(query => ({ query })));
        } catch (error) {
            console.error('seed_all.js (neo4j)', error);
        }
    });

    console.log(`${now} - Running seeders`);
    const dir = path.resolve('src', 'graph-based', 'neode', 'seeders');
    const seeders = await Promise.all(
        // Read all files in the seeders directory
        fs.readdirSync(dir).map(file => {
            try {
                const fileDir = path.join(dir, file);
                const filePath = pathToFileURL(fileDir);
                return import(filePath.href);
            } catch (error) {
                console.error('seed_all.js (neo4j)', error);
            }
        }))
        // Initialize all seeders
        .then(files => files.map(file => new file.default()))
        // Sort seeders by order method
        .then(seeders => seeders.sort((a, b) => a.order() - b.order()))

    await Promise.all(seeders.map(async seeder => {
        if (seeder.constructor.name === 'ChannelSeeder') {
            return;
        }
        console.log(`Finished ${command} on ${seeder.constructor.name}`);
        return await seeder[command](instance);
    }))

    await new ChannelSeeder()[command](instance);
    console.log(`Finished ${command} on ChannelSeeder`);
    console.log(`${now} - Finished ${command} on all seeders`);
    console.log(`Total time: ${new Date() - now}ms`);
}
