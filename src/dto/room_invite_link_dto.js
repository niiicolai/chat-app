
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}uuid`]: uuid,
        [`${prefix}expires_at`]: expires_at,
        [`${prefix}never_expires`]: never_expires,
        [`room_uuid`]: room_uuid,
        [`${prefix}created_at`]: created_at,
        [`${prefix}updated_at`]: updated_at,
    } = entity;

    if (!uuid) throw new Error(`room_invite_link_dto: ${prefix}uuid is required`);
    if (!room_uuid) throw new Error(`room_invite_link_dto: room_uuid is required`);  

    const res = { 
        uuid,
        room_uuid,
    };

    res.never_expires = typeof never_expires !== 'boolean' 
        ? (expires_at === null || expires_at === undefined)
        : never_expires;

    if (expires_at) res.expires_at = expires_at;    
    if (created_at) res.created_at = created_at;
    if (updated_at) res.updated_at = updated_at;

    return res;
}
