
export default (entity) => {

    return {
        uuid: entity.uuid,
        name: entity.name,
        description: entity.description,
        room_uuid: entity.room_uuid,
        channel_type_name: entity.channel_type_name,
        created_at: entity.created_at,
        updated_at: entity.updated_at
    }
}
