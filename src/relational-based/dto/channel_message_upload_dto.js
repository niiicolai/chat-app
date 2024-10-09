
export default (entity = {}) => {
    return {
        uuid: entity.channel_message_upload_uuid,
        channel_message_upload_type_name: entity.channel_message_upload_type_name,
        created_at: entity.channel_message_upload_created_at,
        updated_at: entity.channel_message_upload_updated_at,
    }
}
