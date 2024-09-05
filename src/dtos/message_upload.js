
export default (entity) => {

    return {
        uuid: entity.message_upload_uuid,
        src: entity.message_upload_src,
        upload_type_name: entity.message_upload_upload_type_name,
        size: entity.message_upload_size,
        channel_message_uuid: entity.message_upload_channel_message_uuid,
        created_at: entity.message_upload_created_at,
        updated_at: entity.message_upload_updated_at
    }
}
