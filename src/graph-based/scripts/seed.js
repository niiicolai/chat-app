import { execute as seed } from './seed_all.js';

const args = process.argv.slice(2);
const command = args[0];
if (command) {
    if ([ "up", "down" ].indexOf(command) === -1) {
        console.log("Invalid command - neode. Please use 'up' or 'down'");
        process.exit(1);
    }

    seed(command);
}
