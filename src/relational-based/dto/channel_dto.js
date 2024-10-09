import roomFileDto from './room_file_dto.js';

export default (entity = {}) => {
    const dto = {
        uuid: entity.channel_uuid,
        name: entity.channel_name,
        description: entity.channel_description,
        channel_type_name: entity.channel_type_name,
        room_uuid: entity.room_uuid,
        created_at: entity.channel_created_at,
        updated_at: entity.channel_updated_at,
    };

    if (entity.room_file_uuid) {
        dto.room_file = roomFileDto(entity);
    }

    return dto;
}
