
export default (entity = {}) => {
    return {
        uuid: entity.uuid,
        username: entity.username,
        email: entity.email,
        email_verified: entity.user_email_verification?.is_verified,
        avatar_src: entity.avatar_src,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
