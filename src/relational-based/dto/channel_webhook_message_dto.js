
export default (entity = {}) => {
    return {
        uuid: entity.channel_webhook_message_uuid,
        created_at: entity.channel_webhook_message_created_at,
        updated_at: entity.channel_webhook_message_updated_at,
    };
}
