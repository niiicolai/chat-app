import userDto from './user_dto.js';
import channelMessageUploadDto from './channel_message_upload_dto.js';
import channelMessageDto from './channel_message_dto.js';

export default (entity = {}) => {
    const dto = {
        uuid: entity.uuid,
        src: entity.src,
        size: entity.size,
        size_mb: entity.size ? entity.size / 1024 / 1024 : 0,
        room_file_type_name: entity.room_file_type?.name,
        room_uuid: entity.room?.uuid,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };

    if (entity.user) res.user = userDto(entity.user);
    if (entity.channel_message_upload) {
        entity.channel_message_upload = channelMessageUploadDto(entity.channel_message_upload);

        if (entity.channel_message_upload.channel_message) {
            entity.channel_message_upload.channel_message = channelMessageDto(entity.channel_message_upload.channel_message);
        }
    }

    return dto;
}
