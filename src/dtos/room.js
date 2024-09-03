
export default (entity) => {

    return {
        uuid: entity.room_uuid,
        name: entity.room_name,
        description: entity.room_description,
        room_category_name: entity.room_room_category_name,
        created_at: entity.room_created_at,
        updated_at: entity.room_updated_at
    }
}
