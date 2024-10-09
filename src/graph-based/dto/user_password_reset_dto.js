
export default (entity = {}) => {
    return {
        uuid: entity.uuid,
        expires_at: entity.expires_at,
        user_uuid: entity.user?.uuid,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
