import userDto from './user_dto.js';
import channelMessageUploadDto from './channel_message_upload_dto.js';
import roomFileDto from './room_file_dto.js';
import channelWebhookMessageDto from './channel_webhook_message_dto.js';
import channelWebhookDto from './channel_webhook_dto.js';
import { stringify } from 'uuid';

export default (entity = {}) => {
    const dto = {
        uuid: !(entity._id instanceof Buffer) ? entity._id : stringify(entity._id),
        body: entity.body,
        channel_message_type_name: entity.channel_message_type,
        channel_uuid: !(entity.channel?._id instanceof Buffer) ? entity.channel?._id : stringify(entity.channel?._id),
        room_uuid: !(entity.room?._id instanceof Buffer) ? entity.room?._id : stringify(entity.room?._id),
        user_uuid: !(entity.user?._id instanceof Buffer) ? entity.user?._id : stringify(entity.user?._id),
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };

    if (entity.user) {
        dto.user = userDto(entity.user);
        delete dto.user.email;
    }

    if (entity.channel_message_upload) {
        dto.channel_message_upload = channelMessageUploadDto(entity.channel_message_upload);

        if (entity.channel_message_upload.room_file) {
            dto.channel_message_upload.room_file = roomFileDto(entity.channel_message_upload.room_file);
        }
    }

    if (entity.channel_webhook_message) {
        dto.channel_webhook_message = channelWebhookMessageDto(entity.channel_webhook_message);
        
        if (entity.channel_webhook) {
            dto.channel_webhook_message.channel_webhook = channelWebhookDto({
                ...entity.channel_webhook,
                ...(entity.channel_webhook.room_file && { room_file: entity.channel_webhook.room_file })
            });
        }
    }

    return dto;
}
