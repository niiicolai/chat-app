
export default (entity) => {

    return {
        name: entity.room_role_name,
        created_at: entity.room_role_created_at,
        updated_at: entity.room_role_updated_at
    }
}
