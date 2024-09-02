
export default (entity) => {

    return {
        uuid: entity.uuid,
        body: entity.body,
        channel_uuid: entity.channel_uuid,
        user_uuid: entity.user_uuid,
        created_at: entity.created_at,
        updated_at: entity.updated_at
    }
}
