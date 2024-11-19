import _type from './type.js'; 
import user from './user.js';
import room from './room.js';
import roomFile from './roomFile.js';
import roomInviteLink from './room_invite_link.js';
import roomUser from './room_user.js';
import roomAudit from './room_audit.js';
import channelAudit from './channel_audit.js';
import channelMessage from './channel_message.js';
import channelMessageUpload from './channel_message_upload.js';
import channelWebhook from './channel_webhook.js';
import channelWebhookMessage from './channel_webhook_message.js';
import userStatus from './user_status.js';
import channel from './channel.js';
import google from './google.js';

export default {
    ..._type,
    ...user,
    ...room,
    ...roomFile,
    ...roomInviteLink,
    ...roomUser,
    ...roomAudit,
    ...channelAudit,
    ...channelMessage,
    ...channelMessageUpload,
    ...channelWebhook,
    ...channelWebhookMessage,
    ...channel,
    ...userStatus,
    ...google,
};
