
export default (entity) => {

    return {
        uuid: entity.uuid,
        room_uuid: entity.room_uuid,
        expires_at: entity.expires_at,
        created_at: entity.created_at,
        updated_at: entity.updated_at
    }
}
