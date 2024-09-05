
export default (entity) => {

    return {
        uuid: entity.room_setting_uuid,
        total_upload_bytes: entity.room_setting_total_upload_bytes,
        upload_bytes: entity.room_setting_upload_bytes,
        rules_text: entity.room_setting_rules_text,
        join_channel_uuid: entity.room_setting_join_channel_uuid,
        join_message: entity.room_setting_join_message,
        max_channels: entity.room_setting_max_channels,
        max_members: entity.room_setting_max_members,
        room_uuid: entity.room_setting_room_uuid,
        created_at: entity.room_role_created_at,
        updated_at: entity.room_role_updated_at
    }
}
