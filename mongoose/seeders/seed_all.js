import 'dotenv/config'
import '../index.js';

import ChannelAuditTypeSeeder from "./channel_audit_type.js";
import ChannelMessageTypeSeeder from './channel_message_type.js';
import ChannelMessageUploadTypeSeeder from './channel_message_upload_type.js';
import ChannelTypeSeeder from './channel_type.js';
import ChannelWebhookMessageTypeSeeder from './channel_webhook_message_type.js';
import RoomAuditTypeSeeder from './room_audit_type.js';
import RoomCategorySeeder from './room_category.js';
import RoomFileTypeSeeder from './room_file_type.js';
import RoomUserRoleSeeder from './room_user_role.js';
import UserStatusStateSeeder from './user_status_state.js';

const seeders = [
    new ChannelAuditTypeSeeder(),
    new ChannelMessageTypeSeeder(),
    new ChannelMessageUploadTypeSeeder(),
    new ChannelTypeSeeder(),
    new ChannelWebhookMessageTypeSeeder(),
    new RoomAuditTypeSeeder(),
    new RoomCategorySeeder(),
    new RoomFileTypeSeeder(),
    new RoomUserRoleSeeder(),
    new UserStatusStateSeeder(),
]

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

const execute = async (command) => {
    const now = new Date();
    console.log(`${now} - Executing ${command} on all seeders`);
    
    for (const seeder of seeders) {
        await seeder[command]();
    }

    console.log(`${now} - Finished ${command} on all seeders`);
    console.log(`Total time: ${new Date() - now}ms`);
    process.exit(0);
}

execute(command);

