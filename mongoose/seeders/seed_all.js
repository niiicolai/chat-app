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

import ChannelAuditSeeder from './channel_audit.js';
import ChannelMessageReactionSeeder from './channel_message_reaction.js';
import ChannelMessageUploadSeeder from './channel_message_upload.js';
import ChannelMessageSeeder from './channel_message.js';
import ChannelWebhookMessageSeeder from './channel_webhook_message.js';
import ChannelWebhookSeeder from './channel_webhook.js';
import ChannelSeeder from './channel.js';
import RoomAuditSeeder from './room_audit.js';
import RoomAvatarSeeder from './room_avatar.js';
import RoomFileSeeder from './room_file.js';
import RoomInviteLinkSeeder from './room_invite_link.js';
import RoomUserSeeder from './room_user.js';
import RoomSeeder from './room.js';
import UserEmailVerificationSeeder from './user_email_verification.js';
import UserPasswordResetSeeder from './user_password_reset.js';
import UserStatusSeeder from './user_status.js';
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
    new UserEmailVerificationSeeder(),
    new UserPasswordResetSeeder(),
    new UserStatusSeeder(),
    new RoomSeeder(),
    new RoomAuditSeeder(),
    new RoomAvatarSeeder(),
    new RoomFileSeeder(),
    new RoomInviteLinkSeeder(),
    new RoomUserSeeder(),
    new ChannelSeeder(),
    new ChannelAuditSeeder(),
    new ChannelMessageSeeder(),
    new ChannelMessageUploadSeeder(),
    new ChannelMessageReactionSeeder(),
    new ChannelWebhookSeeder(),
    new ChannelWebhookMessageSeeder(),
]

export const execute = async (command) => {
    const now = new Date();
    console.log(`${now} - Executing ${command} on all seeders`);
    
    for (const seeder of seeders) {
        await seeder[command]();
    }

    console.log(`${now} - Finished ${command} on all seeders`);
    console.log(`Total time: ${new Date() - now}ms`);
    process.exit(0);
}
