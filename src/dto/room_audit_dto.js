
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}uuid`]: uuid,
        [`${prefix}body`]: body,
        [`${prefix}type_name`]: room_audit_type_name,
        [`${prefix}room_uuid`]: room_uuid,
        [`${prefix}created_at`]: created_at,
        [`${prefix}updated_at`]: updated_at,
    } = entity;

    if (!uuid) throw new Error(`room_audit_dto: ${prefix}uuid is required`);
    if (!body) throw new Error(`room_audit_dto: ${prefix}body is required`);
    if (!room_audit_type_name) throw new Error(`room_audit_dto: ${prefix}type_name is required`);
    if (!room_uuid) throw new Error(`room_audit_dto: ${prefix}room_uuid is required`);
    if (!created_at) throw new Error(`room_audit_dto: ${prefix}created_at is required`);
    if (!updated_at) throw new Error(`room_audit_dto: ${prefix}updated_at is required`);

    return { 
        uuid, 
        body, 
        room_audit_type_name, 
        room_uuid, 
        created_at, 
        updated_at 
    };
}
