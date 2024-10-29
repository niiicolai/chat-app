import userDto from './user_dto.js';
import channelMessageUploadDto from './channel_message_upload_dto.js';
import roomFileDto from './room_file_dto.js';
import channelWebhookMessageDto from './channel_webhook_message_dto.js';
import channelWebhookDto from './channel_webhook_dto.js';
import dateHelper from './_date_helper.js';

export default (entity = {}, relations=[]) => {
    const user = relations.find((rel) => rel.user)?.user || null;
    const channelMessageType = relations.find((rel) => rel.channelMessageType)?.channelMessageType || null;
    const channelMessageUpload = relations.find((rel) => rel.channelMessageUpload)?.channelMessageUpload || null;
    const channelMessageUploadType = relations.find((rel) => rel.channelMessageUploadType)?.channelMessageUploadType || null;
    const channelWebhookMessage = relations.find((rel) => rel.channelWebhookMessage)?.channelWebhookMessage || null;
    const channelWebhook = relations.find((rel) => rel.channelWebhook)?.channelWebhook || null;
    const channelWebhookFile = relations.find((rel) => rel.channelWebhookFile)?.channelWebhookFile || null;
    const roomFile = relations.find((rel) => rel.roomFile)?.roomFile || null;
    const channel = relations.find((rel) => rel.channel)?.channel || null;

    const dto = { uuid: entity.uuid, body: entity.body };

    if (channelMessageType) {
        dto.channel_message_type_name = channelMessageType.name;
    }

    if (user) {
        dto.user = userDto(user);
        dto.user_uuid = user.uuid;
        delete dto.user.email;
    }

    if (channel) {
        dto.channel_uuid = channel.uuid;
    }

    if (channelWebhookMessage) {
        dto.channel_webhook_message = channelWebhookMessageDto(channelWebhookMessage);
        if (channelWebhook) {
            dto.channel_webhook_message.channel_webhook = channelWebhookDto(channelWebhook);
            
            if (channelWebhookFile) {
                dto.channel_webhook_message.channel_webhook.room_file = roomFileDto(channelWebhookFile);
            }
        }
    }

    if (channelMessageUpload) {
        const channelMessageUploadRel = [];
        if (channelMessageUploadType) channelMessageUploadRel.push({ channelMessageUploadType });
        dto.channel_message_upload = channelMessageUploadDto(channelMessageUpload, channelMessageUploadRel);
        if (roomFile) {
            dto.channel_message_upload.room_file = roomFileDto(roomFile);
        }
    }

    return dateHelper(entity, dto);
}
