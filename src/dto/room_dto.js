
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}uuid`]: uuid,
        [`${prefix}name`]: name,
        [`${prefix}description`]: description,
        [`room_category_name`]: room_category_name,
        [`bytes_used`]: bytes_used,
        [`mb_used`]: mb_used,
        [`${prefix}created_at`]: created_at,
        [`${prefix}updated_at`]: updated_at,
    } = entity;

    if (!uuid) throw new Error(`room_dto: ${prefix}uuid is required`);
    if (!name) throw new Error(`room_dto: ${prefix}name is required`);
    if (!description) throw new Error(`room_dto: ${prefix}description is required`);
    if (!room_category_name) throw new Error(`room_dto: room_category_name is required`);

    const res = { 
        uuid, 
        name, 
        description,
        room_category_name, 
    };

    if (bytes_used) res.bytes_used = bytes_used;
    if (mb_used) res.mb_used = mb_used;
    if (created_at) res.created_at = created_at;
    if (updated_at) res.updated_at = updated_at;

    return res;
}
