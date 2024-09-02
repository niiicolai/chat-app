
export default (entity) => {

    return {
        uuid: entity.uuid,
        username: entity.username,
        email: entity.email,
        created_at: entity.created_at,
        updated_at: entity.updated_at
    }
}
