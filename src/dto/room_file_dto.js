
export default (entity = {}, type = 'mysql') => {
    const res = {};
    
    if (type === 'mysql') {
        if (entity.room_file_uuid) res.uuid = entity.room_file_uuid;
        if (entity.room_file_src) res.src = entity.room_file_src;
        if (entity.room_file_size_bytes) res.size_bytes = entity.room_file_size_bytes;
        if (entity.room_file_size_mb) res.size_mb = entity.room_file_size_mb;
        if (entity.room_file_type_name) res.room_file_type_name = entity.room_file_type_name;
        if (entity.room_file_room_uuid) res.room_uuid = entity.room_file_room_uuid;
        if (entity.room_file_created_at) res.created_at = entity.room_file_created_at;
        if (entity.room_file_updated_at) res.updated_at = entity.room_file_updated_at;
    }
    else if (type === 'mongodb') {
        if (entity.uuid) res.uuid = entity.uuid;
        if (entity.src) res.src = entity.src;
        if (entity.size_bytes) res.size_bytes = entity.size;
        if (entity.size_mb) res.size_mb = entity.size_mb;
        if (entity.room_file_type?.name) res.room_file_type_name = entity.room_file_type.name;
        if (entity.room?.uuid) res.room_uuid = entity.room.uuid;
        if (entity.created_at) res.created_at = entity.created_at;
        if (entity.updated_at) res.updated_at = entity.updated_at;
    }
    else if (type === 'neo4j') {
        console.warn('neo4j: not implemented yet');
    }

    return res;
}
