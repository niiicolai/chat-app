
export default (entity = {}) => {
    return {
        uuid: entity.user_password_reset_uuid,
        expires_at: entity.user_password_reset_expires_at,
        user_uuid: entity.user_uuid,
        created_at: entity.user_password_reset_created_at,
        updated_at: entity.user_password_reset_updated_at,
    };
}
