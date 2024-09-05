
export default (entity) => {

    return {
        uuid: entity.user_uuid,
        username: entity.user_username,
        avatar_src: entity.user_avatar_src,
        created_at: entity.user_created_at,
        updated_at: entity.user_updated_at
    }
}
