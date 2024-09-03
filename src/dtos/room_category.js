
export default (entity) => {

    return {
        name: entity.room_category_name,
        created_at: entity.room_category_created_at,
        updated_at: entity.room_category_updated_at
    }
}
