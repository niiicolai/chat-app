
export default (entity) => {

    return {
        uuid: entity.room_invite_link_uuid,
        room_uuid: entity.room_invite_link_room_uuid,
        expires_at: entity.room_invite_link_expires_at,
        created_at: entity.room_invite_link_created_at,
        updated_at: entity.room_invite_link_updated_at
    }
}
