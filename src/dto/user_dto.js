
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}uuid`]: uuid,
        [`${prefix}username`]: username,
        [`${prefix}email`]: email,
        [`${prefix}email_verified`]: email_verified,
        [`${prefix}avatar_src`]: avatar_src,
        [`${prefix}created_at`]: created_at,
        [`${prefix}updated_at`]: updated_at,
    } = entity;

    if (!uuid) throw new Error(`user_dto: ${prefix}uuid is required`);
    if (!username) throw new Error(`user_dto: ${prefix}username is required`);

    const res = { 
        uuid,
        username,
        email_verified,
    };

    if (email) res.email = email;
    if (avatar_src) res.avatar_src = avatar_src;
    if (created_at) res.created_at = created_at;
    if (updated_at) res.updated_at = updated_at;

    return res;
}
