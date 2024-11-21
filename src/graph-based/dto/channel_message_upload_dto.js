import dateHelper from './_date_helper.js';
import channelMessageDto from './channel_message_dto.js';

export default (entity = {}, relations=[]) => {
    const channelMessageUploadType = relations.find((rel) => rel.channelMessageUploadType)?.channelMessageUploadType || null;
    const channelMessage = relations.find((rel) => rel.channelMessage)?.channelMessage || null;

    const dto = { uuid: entity.uuid };

    if (channelMessageUploadType) {
        dto.channel_message_upload_type_name = channelMessageUploadType.name;
    }

    if (channelMessage) {
        dto.channel_message = channelMessageDto(channelMessage);
    }

    return dateHelper(entity, dto);
}
