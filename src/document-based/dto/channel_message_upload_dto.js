
export default (entity = {}) => {
    return {
        uuid: entity.uuid,
        channel_message_upload_type_name: entity.channel_message_upload_type_name,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
