
export default (entity = {}) => {
    return { 
        uuid: entity.uuid,
        body: entity.body,
        channel_audit_type_name: entity.channel_audit_type_name, 
        channel_uuid, room_uuid: entity.room_uuid,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
