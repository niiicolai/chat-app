
export default (entity) => {

    return {
        name: entity.channel_type_name,
        created_at: entity.channel_type_created_at,
        updated_at: entity.channel_type_updated_at
    }
}
