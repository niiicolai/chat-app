
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}uuid`]: uuid,
        [`${prefix}body`]: body,
        [`channel_message_type_name`]: channel_message_type_name,
        [`channel_uuid`]: channel_uuid,
        [`room_uuid`]: room_uuid,
        [`user_uuid`]: user_uuid,
        [`${prefix}created_at`]: created_at,
        [`${prefix}updated_at`]: updated_at,
    } = entity;

    if (!uuid) throw new Error(`channel_message_dto: ${prefix}uuid is required`);
    if (!body) throw new Error(`channel_message_dto: ${prefix}body is required`);    

    const res = { 
        uuid,
        body,
    };

    if (channel_message_type_name) res.channel_message_type_name = channel_message_type_name;
    if (channel_uuid) res.channel_uuid = channel_uuid;
    if (room_uuid) res.room_uuid = room_uuid;
    if (user_uuid) res.user_uuid = user_uuid;
    if (created_at) res.created_at = created_at;
    if (updated_at) res.updated_at = updated_at;

    return res;
}
