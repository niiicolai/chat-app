
export default (entity) => {

    return {
        uuid: entity.channel_message_uuid,
        body: entity.channel_message_body,
        channel_uuid: entity.channel_message_channel_uuid,
        user_uuid: entity.channel_message_user_uuid,
        created_at: entity.channel_message_created_at,
        updated_at: entity.channel_message_updated_at
    }
}
