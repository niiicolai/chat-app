import 'dotenv/config'
import instance from '../index.js';

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
import UserLoginTypeSeeder from './user_login_type.js';

const seederTypes = [
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
]

const seedSingle = async (seeder, command, now) => {
    if (command === 'up') {
        await seeder.down();
    }

    await seeder[command]();
    console.log(`${now} - Finished ${command} on ${seeder.constructor.name}`);
}

export const execute = async (command) => {
    const now = new Date();
    console.log(`${now} - Executing ${command} on all seeders`);

    await Promise.all(seederTypes.map(async (seeder) => {
        await seedSingle(seeder, command, now);
    }));

    await seedSingle(new UserSeeder(), command, now);
    await seedSingle(new RoomSeeder(), command, now);
    await seedSingle(new ChannelSeeder(), command, now);

    console.log(`${now} - Finished ${command} on all seeders`);
    console.log(`Total time: ${new Date() - now}ms`);
}
