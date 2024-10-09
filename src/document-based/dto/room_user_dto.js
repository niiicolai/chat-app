
export default (entity = {}) => {
    return {
        uuid: entity.uuid,
        room_user_role_name: entity.room_user_role?.name,
        user_uuid: entity.user?.uuid,
        room_uuid: entity.room?.uuid,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
