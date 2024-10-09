
export default (entity = {}) => {
    return {
        uuid: entity.uuid,
        body: entity.body,
        room_audit_type_name: entity.room_audit_type_name,
        room_uuid: entity.room_uuid,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
