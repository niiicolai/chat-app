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
import ChannelSeeder from './channel.js';
import RoomSeeder from './room.js';
import UserSeeder from './user.js';

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
    new UserSeeder(),
    new RoomSeeder(),
    new ChannelSeeder(),
]

export const execute = async (command) => {
    const now = new Date();
    console.log(`${now} - Executing ${command} on all seeders`);
    
    for (const seeder of seeders) {
        if (command === 'up') {
            await seeder.down(); // Clean up first
        }

        await seeder[command]();
    }

    console.log(`${now} - Finished ${command} on all seeders`);
    console.log(`Total time: ${new Date() - now}ms`);
    process.exit(0);
}
