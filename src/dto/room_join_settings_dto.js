
export default (entity = {}, type = 'mysql') => {
    const res = {};
    
    if (type === 'mysql') {
        if (entity.join_channel_uuid) res.join_channel_uuid = entity.join_channel_uuid;
        if (entity.join_message) res.join_message = entity.join_message;
    }
    else if (type === 'mongodb') {
        if (entity.join_channel_uuid) res.join_channel_uuid = entity.join_channel_uuid;
        if (entity.join_message) res.join_message = entity.join_message;
    }
    else if (type === 'neo4j') {
        console.warn('neo4j: not implemented yet');
    }

    return res;
}
