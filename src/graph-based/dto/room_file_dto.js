import userDto from './user_dto.js';
import channelMessageUploadDto from './channel_message_upload_dto.js';
import dateHelper from './_date_helper.js';

export default (entity = {}) => {

    const dto = {
        uuid: entity.uuid,
        src: entity.src,
        size: entity?.size?.low || entity.size,
        room_uuid: entity?.room?.uuid,
        room_file_type_name: entity?.roomFileType?.name,
    };

    if (dto.size) {
        dto.size_mb = parseFloat(dto.size / 1024 / 1024).toFixed(2);
    }

    if (entity.user) {
        dto.user = userDto(entity.user);
    }

    if (entity.channelMessageUpload) {
        dto.channel_message_upload = channelMessageUploadDto({ 
            ...entity.channelMessageUpload,
            ...(entity?.channelMessage && { channel_message: entity.channelMessage }),
        });
    }

    return dateHelper(entity, dto);
}
