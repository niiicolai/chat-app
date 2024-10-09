
export default (entity = {}, type = 'mysql') => {
    const res = {};
    
    if (type === 'mysql') {
        if (entity.user_uuid) res.uuid = entity.user_uuid;
        if (entity.user_username) res.username = entity.user_username;
        if (entity.user_email) res.email = entity.user_email;
        if (entity.user_email_verified) res.email_verified = entity.user_email_verified;
        if (entity.user_avatar_src) res.avatar_src = entity.user_avatar_src;
        if (entity.user_created_at) res.created_at = entity.user_created_at;
        if (entity.user_updated_at) res.updated_at = entity.user_updated_at;
    }
    else if (type === 'mongodb') {
        if (entity.uuid) res.uuid = entity.uuid;
        if (entity.username) res.username = entity.username;
        if (entity.email) res.email = entity.email;
        if (entity.user_email_verification) res.email_verified = entity.user_email_verification.is_verified;
        if (entity.avatar_src) res.avatar_src = entity.avatar_src;
        if (entity.created_at) res.created_at = entity.created_at;
        if (entity.updated_at) res.updated_at = entity.updated_at;
    } 
    else if (type === 'neo4j') {
        console.warn('neo4j: not implemented yet');
    }

    return res;
}
