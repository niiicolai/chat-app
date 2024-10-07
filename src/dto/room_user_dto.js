
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}uuid`]: uuid,
        [`room_user_role_name`]: room_user_role_name,
        [`user_uuid`]: user_uuid,
        [`room_uuid`]: room_uuid,
        [`${prefix}created_at`]: created_at,
        [`${prefix}updated_at`]: updated_at,
    } = entity;

    if (!uuid) throw new Error(`room_user_dto: ${prefix}uuid is required`);
    if (!room_user_role_name) throw new Error(`room_user_dto: room_user_role_name is required`);
    if (!user_uuid) throw new Error(`room_user_dto: user_uuid is required`);
    if (!room_uuid) throw new Error(`room_user_dto: room_uuid is required`);

    const res = { 
        uuid,
        room_user_role_name,
        user_uuid,
        room_uuid,
    };

    if (created_at) res.created_at = created_at;
    if (updated_at) res.updated_at = updated_at;

    return res;
}
