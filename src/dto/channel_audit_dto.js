
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}uuid`]: uuid,
        [`${prefix}body`]: body,
        [`${prefix}type_name`]: channel_audit_type_name,
        [`${prefix}channel_uuid`]: channel_uuid,
        [`${prefix}room_uuid`]: room_uuid,
        [`${prefix}created_at`]: created_at,
        [`${prefix}updated_at`]: updated_at,
    } = entity;

    if (!uuid) throw new Error(`channel_audit_dto: ${prefix}uuid is required`);
    if (!body) throw new Error(`channel_audit_dto: ${prefix}body is required`);
    if (!channel_audit_type_name) throw new Error(`channel_audit_dto: ${prefix}type_name is required`);
    if (!channel_uuid) throw new Error(`channel_audit_dto: ${prefix}channel_uuid is required`);
    if (!room_uuid) throw new Error(`channel_audit_dto: ${prefix}room_uuid is required`);
    if (!created_at) throw new Error(`channel_audit_dto: ${prefix}created_at is required`);
    if (!updated_at) throw new Error(`channel_audit_dto: ${prefix}updated_at is required`);

    return { 
        uuid, 
        body, 
        channel_audit_type_name, 
        channel_uuid, room_uuid, 
        created_at, 
        updated_at 
    };
}
