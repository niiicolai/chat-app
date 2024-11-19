
export default (entity = {}) => {
    return {
        uuid: entity.uuid,
        user_login_type_name: entity.user_login_type?.name,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
