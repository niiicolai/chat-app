import userDto from './user_dto.js';
import channelMessageUploadDto from './channel_message_upload_dto.js';

export default (entity = {}) => {
    const dto = {
        uuid: entity.room_file_uuid,
        src: entity.room_file_src,
        size_bytes: entity.room_file_size_bytes,
        size_mb: entity.room_file_size_mb,
        room_file_type_name: entity.room_file_type_name,
        room_uuid: entity.room_uuid,
        created_at: entity.room_file_created_at,
        updated_at: entity.room_file_updated_at,
    };

    if (entity.user_uuid) {
        dto.user = userDto(entity);
    }

    if (entity.channel_message_upload_uuid) {
        dto.channel_message_upload = channelMessageUploadDto(entity);
        dto.channel_message_upload.channel_message = {
            uuid: entity.channel_message_uuid,
            body: entity.channel_message_body,
        }
    }

    return dto;
}
