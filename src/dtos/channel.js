
export default (entity) => {

    return {
        uuid: entity.channel_uuid,
        name: entity.channel_name,
        description: entity.channel_description,
        room_uuid: entity.channel_room_uuid,
        channel_type_name: entity.channel_channel_type_name,
        created_at: entity.channel_created_at,
        updated_at: entity.channel_updated_at
    }
}
