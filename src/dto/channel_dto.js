
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}uuid`]: uuid,
        [`${prefix}name`]: name,
        [`${prefix}description`]: description,
        [`channel_type_name`]: channel_type_name,
        [`room_uuid`]: room_uuid,
        [`${prefix}created_at`]: created_at,
        [`${prefix}updated_at`]: updated_at,
    } = entity;

    if (!uuid) throw new Error(`channel_dto: ${prefix}uuid is required`);
    if (!name) throw new Error(`channel_dto: ${prefix}name is required`);    
    if (!description) throw new Error(`channel_dto: ${prefix}description is required`);
    if (!channel_type_name) throw new Error(`channel_dto: channel_type_name is required`);
    if (!room_uuid) throw new Error(`channel_dto: room_uuid is required`);

    const res = { 
        uuid,
        name,
        description,
        channel_type_name,
        room_uuid,
    };

    if (created_at) res.created_at = created_at;
    if (updated_at) res.updated_at = updated_at;

    return res;
}
