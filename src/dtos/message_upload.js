
export default (entity) => {

    return {
        uuid: entity.uuid,
        src: entity.src,
        upload_type_name: entity.upload_type_name,
        size: entity.size,
        room_message_uuid: entity.room_message_uuid,
        created_at: entity.created_at,
        updated_at: entity.updated_at
    }
}
