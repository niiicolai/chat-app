
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}uuid`]: uuid,
        [`channel_message_upload_type_name`]: channel_message_upload_type_name,
        [`${prefix}created_at`]: created_at,
        [`${prefix}updated_at`]: updated_at,
    } = entity;

    if (!uuid) throw new Error(`channel_message_upload_dto: ${prefix}uuid is required`);
    if (!channel_message_upload_type_name) throw new Error(`channel_message_upload_dto: channel_message_upload_type_name is required`);    

    const res = { 
        uuid,
        channel_message_upload_type_name, 
    };

    if (created_at) res.created_at = created_at;
    if (updated_at) res.updated_at = updated_at;

    return res;
}
