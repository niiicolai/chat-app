import userDto from './user_dto.js';
import channelMessageUploadDto from './channel_message_upload_dto.js';
import channelMessageDto from './channel_message_dto.js';
import { stringify } from 'uuid';

export default (entity = {}) => {
    const dto = {
        uuid: !(entity._id instanceof Buffer) ? entity._id : stringify(entity._id),
        src: entity.src,
        size: entity.size,
        size_mb: entity.size ? entity.size / 1024 / 1024 : 0,
        room_file_type_name: entity.room_file_type,
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
