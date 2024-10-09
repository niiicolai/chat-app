import userDto from './user_dto.js';
import channelMessageUploadDto from './channel_message_upload_dto.js';
import roomFileDto from './room_file_dto.js';
import channelWebhookMessageDto from './channel_webhook_message_dto.js';
import channelWebhookDto from './channel_webhook_dto.js';

export default (entity = {}) => {
    const dto = {
        uuid: entity.uuid,
        body: entity.body,
        channel_message_type_name: entity.channel_message_type_name,
        channel_uuid: entity.channel_uuid,
        room_uuid: entity.room_uuid,
        user_uuid: entity.user_uuid,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };

    if (entity.user) dto.user = userDto(entity.user);

    if (entity.channel_message_upload) {
        dto.channel_message_upload = channelMessageUploadDto(entity.channel_message_upload);

        if (entity.channel_message_upload.room_file) {
            dto.channel_message_upload.room_file = roomFileDto(entity.channel_message_upload.room_file);
        }
    }

    if (entity.channel_webhook_message) {
        dto.channel_webhook_message = channelWebhookMessageDto(entity.channel_webhook_message);
        
        if (entity.channel_webhook_message.channel_webhook) {
            dto.channel_webhook_message.channel_webhook = channelWebhookDto(entity.channel_webhook_message.channel_webhook);
            
            if (entity.channel_webhook_message.channel_webhook.room_file) {
                dto.channel_webhook_message.channel_webhook.room_file = roomFileDto(entity.channel_webhook_message.channel_webhook.room_file);
            }
        }
    }

    return dto;
}
