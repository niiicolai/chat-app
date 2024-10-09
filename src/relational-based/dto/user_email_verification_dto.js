
export default (entity = {}) => {
    return {
        uuid: entity.user_email_verification_uuid,
        user_uuid: entity.user_uuid,
        is_verified: entity.user_email_verification_is_verified,
        created_at: entity.user_email_verification_created_at,
        updated_at: entity.user_email_verification_updated_at,
    };
}
