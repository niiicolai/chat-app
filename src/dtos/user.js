
export default (entity) => {

    return {
        uuid: entity.user_uuid,
        username: entity.user_username,
        email: entity.user_email,
        created_at: entity.user_created_at,
        updated_at: entity.user_updated_at
    }
}
