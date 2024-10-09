import roomFileDto from './room_file_dto.js';

export default (entity = {}) => {
    const dto = {
        uuid: entity.channel_webhook_uuid,
        name: entity.channel_webhook_name,
        description: entity.channel_webhook_description,
        channel_webhook_type_name: entity.channel_webhook_type_name,
        room_uuid: entity.room_uuid,
        channel_uuid: entity.channel_uuid,
        created_at: entity.channel_webhook_created_at,
        updated_at: entity.channel_webhook_updated_at,
    }

    if (entity.room_file_uuid) {
        dto.room_file = roomFileDto(entity);
    }

    return dto;
}
