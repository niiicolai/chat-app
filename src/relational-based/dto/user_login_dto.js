
export default (entity = {}) => {
    return {
        uuid: entity.user_login_uuid,
        user_login_type_name: entity.user_login_type_name,
        created_at: entity.user_login_created_at,
        updated_at: entity.user_login_updated_at,
    };
}
