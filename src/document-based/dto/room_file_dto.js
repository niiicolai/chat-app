import userDto from './user_dto';
import channelMessageUploadDto from './channel_message_upload_dto';
import channelMessageDto from './channel_message_dto';

export default (entity = {}) => {
    const dto = {
        uuid: entity.uuid,
        src: entity.src,
        size_bytes: entity.size_bytes,
        size_mb: entity.size_mb,
        room_file_type_name: entity.room_file_type?.name,
        room_uuid: entity.room_uuid,
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
