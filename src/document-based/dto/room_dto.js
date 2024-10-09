
export default (entity = {}) => {
    return {
        uuid: entity.uuid,
        name: entity.name,
        description: entity.description,
        room_category_name: entity.room_category?.name,
        bytes_used: entity.bytes_used,
        mb_used: entity.mb_used,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
