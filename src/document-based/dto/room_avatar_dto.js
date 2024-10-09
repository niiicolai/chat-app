
export default (entity = {}) => {
    return {
        uuid: entity.uuid,
        room_file_uuid: entity.room_file?.uuid,
        room_uuid: entity.room?.uuid,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
