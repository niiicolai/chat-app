
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}uuid`]: uuid,
        [`${prefix}name`]: name,
        [`${prefix}description`]: description,
        [`channel_webhook_type_name`]: channel_webhook_type_name,
        [`room_uuid`]: room_uuid,
        [`channel_uuid`]: channel_uuid,
        [`${prefix}created_at`]: created_at,
        [`${prefix}updated_at`]: updated_at,
    } = entity;

    if (!uuid) throw new Error(`channel_webhook_dto: ${prefix}uuid is required`);
    if (!name) throw new Error(`channel_webhook_dto: ${prefix}name is required`);  
    if (!room_uuid) throw new Error(`channel_webhook_dto: room_uuid is required`);  

    const res = { 
        uuid,
        name,
        room_uuid,
    };

    if (description) res.description = description;
    if (channel_webhook_type_name) res.channel_webhook_type_name = channel_webhook_type_name;
    if (channel_uuid) res.channel_uuid = channel_uuid;
    if (created_at) res.created_at = created_at;
    if (updated_at) res.updated_at = updated_at;

    return res;
}
