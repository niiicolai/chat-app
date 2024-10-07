
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}uuid`]: uuid,
        [`${prefix}src`]: src,
        [`${prefix}size_bytes`]: size_bytes,
        [`${prefix}size_mb`]: size_mb,
        [`room_file_type_name`]: room_file_type_name,
        [`room_uuid`]: room_uuid,
        [`${prefix}created_at`]: created_at,
        [`${prefix}updated_at`]: updated_at,
    } = entity;

    if (!uuid) throw new Error(`room_file_dto: ${prefix}uuid is required`);
    if (!src) throw new Error(`room_file_dto: ${prefix}src is required`);  

    const res = { 
        uuid,
        src,
    };

    if (room_file_type_name) res.room_file_type_name = room_file_type_name;
    if (room_uuid) res.room_uuid = room_uuid;
    if (size_bytes) res.size_bytes = size_bytes;
    if (size_mb) res.size_mb = size_mb;
    if (created_at) res.created_at = created_at;
    if (updated_at) res.updated_at = updated_at;

    return res;
}
