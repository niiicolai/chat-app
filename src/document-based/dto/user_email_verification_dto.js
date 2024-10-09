
export default (entity = {}) => {
    return {
        uuid: entity.uuid,
        user_uuid: entity.user?.uuid,
        is_verified: entity.user_email_verification?.is_verified,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
