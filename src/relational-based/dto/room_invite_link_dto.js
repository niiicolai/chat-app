
export default (entity = {}) => {
    return {
        uuid: entity.room_invite_link_uuid,
        room_uuid: entity.room_uuid,
        expires_at: entity.room_invite_link_expires_at,
        never_expires: entity.room_invite_link_never_expires,
        created_at: entity.room_invite_link_created_at,
        updated_at: entity.room_invite_link_updated_at,
    };
}
