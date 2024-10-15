import roomFileDto from './room_file_dto.js';

export default (entity = {}) => {
    const dto = {
        uuid: entity.uuid,
        name: entity.name,
        description: entity.description,
        room_uuid: entity.room?.uuid,
        channel_uuid: entity.channel?.uuid,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };

    if (entity.room_file) {
        dto.room_file = roomFileDto(entity.room_file);
    }

    return dto;
}
