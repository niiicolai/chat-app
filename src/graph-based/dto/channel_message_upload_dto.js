import dateHelper from './_date_helper.js';

export default (entity = {}, relations=[]) => {
    const channelMessageUploadType = relations.find((rel) => rel.channelMessageUploadType)?.channelMessageUploadType || null;
    const channelMessage = relations.find((rel) => rel.channelMessage)?.channelMessage || null;

    const dto = { uuid: entity.uuid };

    if (channelMessageUploadType) {
        dto.channel_message_upload_type_name = channelMessageUploadType.name;
    }

    if (channelMessage) {
        dto.channel_message = channelMessage;
    }

    return dateHelper(entity, dto);
}
