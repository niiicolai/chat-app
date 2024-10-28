import { execute } from "./seed_all.js";

const args = process.argv.slice(2);
const command = args[0];
if (!command) {
    console.log("Please specify a command. Use 'up' or 'down'");
    process.exit(1);
}

if ([ "up", "down" ].indexOf(command) === -1) {
    console.log("Invalid command. Please use 'up' or 'down'");
    process.exit(1);
}

execute(command);
