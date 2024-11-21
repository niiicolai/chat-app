
export default (entity = {}) => {
    return {
        uuid: entity.uuid,
        room_uuid: entity.room?.uuid,
        expires_at: entity.expires_at || null,
        never_expires: entity.expires_at ? false : true,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
