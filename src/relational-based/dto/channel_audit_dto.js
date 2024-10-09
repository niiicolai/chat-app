
export default (entity = {}) => {
    return {
        uuid: entity.channel_audit_uuid,
        body: entity.channel_audit_body,
        channel_audit_type_name: entity.channel_audit_type_name,
        channel_uuid: entity.channel_uuid,
        room_uuid: entity.room_uuid,
        created_at: entity.channel_audit_created_at,
        updated_at: entity.channel_audit_updated_at,
    };
}
