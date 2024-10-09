
export default (entity = {}, type = 'mysql') => {
    const res = {};
    
    if (type === 'mysql') {
        if (entity.room_user_uuid) res.uuid = entity.room_user_uuid;
        if (entity.room_user_role_name) res.room_user_role_name = entity.room_user_role_name;
        if (entity.room_user_user_uuid) res.user_uuid = entity.room_user_user_uuid;
        if (entity.room_user_room_uuid) res.room_uuid = entity.room_user_room_uuid;
        if (entity.room_user_created_at) res.created_at = entity.room_user_created_at;
        if (entity.room_user_updated_at) res.updated_at = entity.room_user_updated_at;
    }
    else if (type === 'mongodb') {
        if (entity.uuid) res.uuid = entity.uuid;
        if (entity.room_user_role?.name) res.room_user_role_name = entity.room_user_role.name;
        if (entity.user?.uuid) res.user_uuid = entity.user.uuid;
        if (entity.room?.uuid) res.room_uuid = entity.room.uuid;
        if (entity.created_at) res.created_at = entity.created_at;
        if (entity.updated_at) res.updated_at = entity.updated_at;
    }
    else if (type === 'neo4j') {
        console.warn('neo4j: not implemented yet');
    }

    return res;
}
