
export default (entity) => {

    return {
        uuid: entity.uuid,
        room_uuid: entity.room_uuid,
        user_uuid: entity.user_uuid,
        room_role_name: entity.room_role_name,
        created_at: entity.created_at,
        updated_at: entity.updated_at
    }
}
