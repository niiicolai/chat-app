
export default (entity = {}, type = 'mysql') => {
    const res = {};
    
    if (type === 'mysql') {
        if (entity.room_avatar_uuid) res.uuid = entity.room_avatar_uuid;
        if (entity.room_avatar_room_file_uuid) res.room_file_uuid = entity.room_avatar_room_file_uuid;
        if (entity.room_avatar_room_uuid) res.room_uuid = entity.room_avatar_room_uuid;
        if (entity.room_avatar_created_at) res.created_at = entity.room_avatar_created_at;
        if (entity.room_avatar_updated_at) res.updated_at = entity.room_avatar_updated_at;
    }
    else if (type === 'mongodb') {
        if (entity.uuid) res.uuid = entity.uuid;
        if (entity.room_file?.uuid) res.room_file_uuid = entity.room_file.uuid;
        if (entity.room?.uuid) res.room_uuid = entity.room.uuid;
        if (entity.created_at) res.created_at = entity.created_at;
        if (entity.updated_at) res.updated_at = entity.updated_at;
    }
    else if (type === 'neo4j') {
        console.warn('neo4j: not implemented yet');
    }

    return res;
}
