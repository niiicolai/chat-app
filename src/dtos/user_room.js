
export default (entity) => {

    return {
        uuid: entity.user_room_uuid,
        room_uuid: entity.user_room_room_uuid,
        user_uuid: entity.user_room_user_uuid,
        room_role_name: entity.user_room_room_role_name,
        created_at: entity.user_room_created_at,
        updated_at: entity.user_room_updated_at
    }
}
