
export default (entity = {}) => {
    return {
        uuid: entity.uuid,
        reaction: entity.reaction,
        user_uuid: entity.user_uuid,
        channel_message_uuid: entity.channel_message_uuid,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
