import messageUploadDto from './message_upload.js';
import userProfileDto from './user_profile.js';

export default (entity) => {

    const dto = {
        uuid: entity.channel_message_uuid,
        body: entity.channel_message_body,
        channel_uuid: entity.channel_message_channel_uuid,
        created_by_system: entity.channel_message_created_by_system,
        user_uuid: entity.channel_message_user_uuid,
        created_at: entity.channel_message_created_at,
        updated_at: entity.channel_message_updated_at
    }

    if (entity.message_upload_uuid) {
        dto.upload =  messageUploadDto(entity);
    }

    if (entity.user_uuid) {
        dto.user = userProfileDto(entity);
    }

    return dto;
}
