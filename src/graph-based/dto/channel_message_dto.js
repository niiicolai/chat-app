import userDto from './user_dto.js';
import channelMessageUploadDto from './channel_message_upload_dto.js';
import roomFileDto from './room_file_dto.js';
import channelWebhookMessageDto from './channel_webhook_message_dto.js';
import channelWebhookDto from './channel_webhook_dto.js';
import dateHelper from './_date_helper.js';

export default (entity = {}) => {
    const dto = { uuid: entity.uuid, body: entity.body };

    if (entity.channelMessageType) {
        dto.channel_message_type_name = entity.channelMessageType.name;
    }

    if (entity.user) {
        dto.user = userDto(entity.user);
        dto.user_uuid = entity.user.uuid;
        delete dto.user.email;
    }

    if (entity.channel) {
        dto.channel_uuid = entity.channel.uuid;
    }

    if (entity.channelWebhookMessage) {
        dto.channel_webhook_message = channelWebhookMessageDto({
            ...entity.channelWebhookMessage,
            channelWebhook: entity.channelWebhook,
            channelWebhookFile: entity.channelWebhookFile,
        });
    }

    if (entity.channelMessageUpload) {
        dto.channel_message_upload = channelMessageUploadDto({
            ...entity.channelMessageUpload,
            channelMessage: entity,
            channelMessageUploadType: entity.channelMessageUploadType,
            channelMessageUploadFile: entity.channelMessageUploadFile,
        });
    }

    return dateHelper(entity, dto);
}
