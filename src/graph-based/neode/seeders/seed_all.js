import 'dotenv/config'
import instance from '../index.js';

import ChannelAuditTypeSeeder from './channel_audit_type.js';
import ChannelMessageTypeSeeder from './channel_message_type.js';
import ChannelMessageUploadTypeSeeder from './channel_message_upload_type.js';
import ChannelTypeSeeder from './channel_type.js';
import ChannelWebhookMessageTypeSeeder from './channel_webhook_message_type.js';
import RoomAuditTypeSeeder from './room_audit_type.js';
import RoomCategorySeeder from './room_category.js';
import RoomFileTypeSeeder from './room_file_type.js';
import RoomUserRoleSeeder from './room_user_role.js';
import UserStatusStateSeeder from './user_status_state.js';
import UserSeeder from './user.js';
import RoomSeeder from './room.js';
import ChannelSeeder from './channel.js';
import UserLoginTypeSeeder from './user_login_type.js';

const seeders = [
    new UserLoginTypeSeeder(),
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
    new ChannelSeeder()
]

export const execute = async (command) => {
    const now = new Date();
    console.log(`${now} - Executing ${command} on all seeders`);
    
    for (const seeder of seeders) {
        if (command === 'up') {
            await seeder.down(instance); // Clean up first
        }

        await seeder[command](instance);
    }

    console.log(`${now} - Finished ${command} on all seeders`);
    console.log(`Total time: ${new Date() - now}ms`);
}
