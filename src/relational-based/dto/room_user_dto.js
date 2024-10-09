
export default (entity = {}) => {
    const dto = {
        uuid: entity.room_user_uuid,
        room_user_role_name: entity.room_user_role_name,
        user_uuid: entity.user_uuid,
        room_uuid: entity.room_uuid,
        created_at: entity.room_user_created_at,
        updated_at: entity.room_user_updated_at,
    };

    if (entity.user_uuid) {
        dto.user = userDto(entity);
    }

    return dto;
}
