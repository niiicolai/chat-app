
export default (entity = {}) => {
    return {
        uuid: entity.room_audit_uuid,
        body: entity.room_audit_body,
        room_audit_type_name: entity.room_audit_type_name,
        room_uuid: entity.room_uuid,
        created_at: entity.room_audit_created_at,
        updated_at: entity.room_audit_updated_at,
    };
}
