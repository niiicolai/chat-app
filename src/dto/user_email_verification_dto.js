
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}uuid`]: uuid,
        [`user_uuid`]: user_uuid,
        [`${prefix}verified_at`]: user_email_verification_verified_at,
        [`${prefix}created_at`]: created_at,
        [`${prefix}updated_at`]: updated_at,
    } = entity;

    if (!uuid) throw new Error(`user_email_verification_dto: ${prefix}uuid is required`);
    if (!user_uuid) throw new Error(`user_email_verification_dto: user_uuid is required`);

    const res = { 
        uuid,
        user_uuid,
        user_email_verification_verified_at,
    };

    if (created_at) res.created_at = created_at;
    if (updated_at) res.updated_at = updated_at;

    return res;
}
