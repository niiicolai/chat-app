
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}uuid`]: uuid,
        [`room_file_uuid`]: room_file_uuid,
        [`room_uuid`]: room_uuid,
        [`${prefix}created_at`]: created_at,
        [`${prefix}updated_at`]: updated_at,
    } = entity;

    if (!uuid) throw new Error(`channel_webhook_dto: ${prefix}uuid is required`); 

    const res = { 
        uuid,
    };

    if (room_file_uuid) res.room_file_uuid = room_file_uuid;
    if (room_uuid) res.room_uuid = room_uuid;
    if (created_at) res.created_at = created_at;
    if (updated_at) res.updated_at = updated_at;

    return res;
}
