import Neode from 'neode';

import User from './models/user.js';
import UserStatus from './models/user_status.js';
import UserStatusState from './models/user_status_state.js';
import UserEmailVerification from './models/user_email_verification.js';
import UserPasswordReset from './models/user_password_reset.js';
import ChannelAuditType from './models/channel_audit_type.js';
import ChannelMessageType from './models/channel_message_type.js';
import ChannelMessageUploadType from './models/channel_message_upload_type.js';
import ChannelType from './models/channel_type.js';
import ChannelWebhookMessageType from './models/channel_webhook_message_type.js';
import RoomAuditType from './models/room_audit_type.js';
import RoomCategory from './models/room_category.js';
import RoomFileType from './models/room_file_type.js';
import RoomUserRole from './models/room_user_role.js';
import Room from './models/room.js';
import RoomAvatar from './models/room_avatar.js';
import RoomAudit from './models/room_audit.js';
import RoomFile from './models/room_file.js';
import RoomFileSettings from './models/room_file_settings.js';
import RoomInviteLink from './models/room_invite_link.js';
import RoomJoinSettings from './models/room_join_settings.js';
import RoomRulesSettings from './models/room_rules_settings.js';
import RoomUserSettings from './models/room_user_settings.js';
import RoomUser from './models/room_user.js';
import RoomChannelSettings from './models/room_channel_settings.js';
import Channel from './models/channel.js';
import ChannelAudit from './models/channel_audit.js';
import ChannelMessage from './models/channel_message.js';
import ChannelMessageUpload from './models/channel_message_upload.js';
import ChannelWebhookMessage from './models/channel_webhook_message.js';
import ChannelWebhook from './models/channel_webhook.js';

const instance = Neode.fromEnv();

instance.with({
    ChannelAuditType,
    ChannelMessageType,
    ChannelMessageUploadType,
    ChannelType,
    ChannelWebhookMessageType,
    RoomAuditType,
    RoomCategory,
    RoomFileType,
    RoomUserRole,
    UserStatusState,
    UserStatus,
    UserEmailVerification,
    UserPasswordReset,
    User,
    Room,
    RoomAvatar,
    RoomAudit,
    RoomFile,
    RoomFileSettings,
    RoomInviteLink,
    RoomJoinSettings,
    RoomRulesSettings,
    RoomUserSettings,
    RoomUser,
    RoomChannelSettings,
    Channel,
    ChannelAudit,
    ChannelMessage,
    ChannelMessageUpload,
    ChannelWebhookMessage,
    ChannelWebhook
});

// Check if the connection is successful
instance.cypher('MATCH (n) RETURN n').then(res => {
    console.log('INFO: Connected to Neo4j');
}).catch(err => {
    console.error('ERROR: Neo4j connection failed', err);
});

export default instance;
