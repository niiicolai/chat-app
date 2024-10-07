
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}uuid`]: uuid,
        [`${prefix}expires_at`]: expires_at,
        [`user_uuid`]: user_uuid,
        [`${prefix}created_at`]: created_at,
        [`${prefix}updated_at`]: updated_at,
    } = entity;

    if (!uuid) throw new Error(`user_password_reset_dto: ${prefix}uuid is required`);
    if (!expires_at) throw new Error(`user_password_reset_dto: ${prefix}expires_at is required`);
    if (!user_uuid) throw new Error(`user_password_reset_dto: user_uuid is required`);

    const res = { 
        uuid,
        expires_at,
        user_uuid,
    };

    if (created_at) res.created_at = created_at;
    if (updated_at) res.updated_at = updated_at;

    return res;
}
