
export default (entity = {}) => {
    return {
        uuid: entity.uuid,
        room_uuid: entity.room?.uuid,
        expires_at: entity.expires_at,
        never_expires: entity.never_expires,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
