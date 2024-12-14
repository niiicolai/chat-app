import channelMessageUploadDto from './channel_message_upload_dto.js';
import roomFileDto from './room_file_dto.js';
import userDto from './user_dto.js';
import channelWebhookMessageDto from './channel_webhook_message_dto.js';
import channelWebhookDto from './channel_webhook_dto.js';

export default (entity = {}) => {
    const dto = {
        uuid: entity.channel_message_uuid,
        body: entity.channel_message_body,
        channel_message_type_name: entity.channel_message_type_name,
        channel_uuid: entity.channel_uuid,
        room_uuid: entity.room_uuid,
        user_uuid: entity.user_uuid,
        created_at: entity.channel_message_created_at,
        updated_at: entity.channel_message_updated_at,
    };

    if (entity.channel_message_upload_uuid) {
        dto.channel_message_upload = channelMessageUploadDto(entity);
    }

    if (entity.channel_message_upload_uuid && entity.room_file_uuid) {
        dto.channel_message_upload.room_file = roomFileDto(entity);
    }

    if (entity.user_uuid) {
        dto.user = userDto(entity);
        delete dto.user.email;
    }

    if (entity.channel_webhook_message_uuid) {
        dto.channel_webhook_message = channelWebhookMessageDto(entity);
    }

    if (entity.channel_webhook_message_uuid && entity.channel_webhook_uuid) {
        dto.channel_webhook_message.channel_webhook = channelWebhookDto(entity);

        if (entity.channel_webhook_room_file_uuid) {
            dto.channel_webhook_message.channel_webhook.room_file = roomFileDto({
                room_file_uuid: entity.channel_webhook_room_file_uuid,
                room_file_src: entity.channel_webhook_room_file_src,
            });
        }
    }

    return dto;
}
