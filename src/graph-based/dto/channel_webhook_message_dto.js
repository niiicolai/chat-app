import dateHelper from './_date_helper.js';
import channelWebhookDto from './channel_webhook_dto.js';

export default (entity = {}) => {
    const dto = { 
        uuid: entity.uuid, 
        body: entity.body,
        ...(entity.channelMessageType && { channel_message_type_name: entity.channelMessageType.name }),
    };

    if (entity.channelWebhook) {
        dto.channel_webhook = channelWebhookDto({
            channel: entity.channel,
            ...entity.channelWebhook,
            ...(entity.channelWebhookFile && { roomFile: entity.channelWebhookFile }),
        });
    }

    return dateHelper(entity, dto);
}
