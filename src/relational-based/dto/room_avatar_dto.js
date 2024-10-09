
export default (entity = {}) => {
    return {
        uuid: entity.room_avatar_uuid,
        room_file_uuid: entity.room_file_uuid,
        room_uuid: entity.room_uuid,
        created_at: entity.room_avatar_created_at,
        updated_at: entity.room_avatar_updated_at,
    };
}
