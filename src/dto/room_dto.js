
export default (entity = {}, type = 'mysql') => {
    const res = {};
    
    if (type === 'mysql') {
        if (entity.room_uuid) res.uuid = entity.room_uuid;
        if (entity.room_name) res.name = entity.room_name;
        if (entity.room_description) res.description = entity.room_description;
        if (entity.room_category_name) res.room_category_name = entity.room_category_name;
        if (entity.room_bytes_used) res.bytes_used = entity.room_bytes_used;
        if (entity.room_mb_used) res.mb_used = entity.room_mb_used;
        if (entity.room_created_at) res.created_at = entity.room_created_at;
        if (entity.room_updated_at) res.updated_at = entity.room_updated_at;
    }
    else if (type === 'mongodb') {
        if (entity.uuid) res.uuid = entity.uuid;
        if (entity.name) res.name = entity.name;
        if (entity.description) res.description = entity.description;
        if (entity.room_category?.name) res.room_category_name = entity.room_category.name;
        if (entity.bytes_used) res.bytes_used = entity.bytes_used;
        if (entity.mb_used) res.mb_used = entity.mb_used;
        if (entity.created_at) res.created_at = entity.created_at;
        if (entity.updated_at) res.updated_at = entity.updated_at;
    }
    else if (type === 'neo4j') {
        console.warn('neo4j: not implemented yet');
    }

    return res;
}
