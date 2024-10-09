import roomFileDto from './room_file_dto.js';

export default (entity = {}) => {
    const dto = { 
        uuid: entity.uuid,
        name: entity.name,
        description: entity.description,
        channel_type_name: entity.channel_type_name,
        room_uuid: entity.room_uuid,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };

    if (entity.room_file) {
        dto.room_file = roomFileDto(entity.room_file);
    }

    return dto;
}
