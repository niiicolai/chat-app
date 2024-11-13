import newman from 'newman';
import path from 'path';

const dir = path.resolve('test', 'api_test');
const collection = path.join(dir, 'Chat API Test.postman_collection.json');
const environmentMySQL = path.join(dir, 'Chat App Dev MySQL.postman_environment.json');
const environmentMongoDB = path.join(dir, 'Chat App Dev MongoDB.postman_environment.json');
const environmentNeo4j = path.join(dir, 'Chat App Dev Neo4j.postman_environment.json');

function runTest(collection, environment) {
    console.log(`Running test for ${environment}...`);

    newman.run({
        collection,
        environment,
        reporters: 'cli'
    }, function (err) {
        if (err) { throw err; }
        console.log(`collection run complete for ${environment}!`);
    });
}

const args = process.argv.slice(2);
const command = args[0];
if (!command) {
    console.log("Please specify a command. Use 'all' or 'mysql' or 'mongodb' or 'neo4j'");
    process.exit(1);
}

if ([ "all", "mysql", "mongodb", "neo4j" ].indexOf(command) === -1) {
    console.log("Invalid command. Please use 'all' or 'mysql' or 'mongodb' or 'neo4j'");
    process.exit(1);
}

if (command === "mysql") {
    runTest(collection, environmentMySQL);
}

if (command === "mongodb") {
    runTest(collection, environmentMongoDB);
}

if (command === "neo4j") {
    runTest(collection, environmentNeo4j);
}

if (command === "all") {
    runTest(collection, environmentMySQL);
    runTest(collection, environmentMongoDB);
    runTest(collection, environmentNeo4j);
}
 
