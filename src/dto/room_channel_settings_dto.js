
export default (entity = {}, type = 'mysql') => {
    const res = {};
    
    if (type === 'mysql') {
        if (entity.max_channels) res.max_channels = entity.max_channels;
        if (entity.message_days_to_live) res.message_days_to_live = entity.message_days_to_live;
    }
    else if (type === 'mongodb') {
        if (entity.max_channels) res.max_channels = entity.max_channels;
        if (entity.message_days_to_live) res.message_days_to_live = entity.message_days_to_live;
    }
    else if (type === 'neo4j') {
        console.warn('neo4j: not implemented yet');
    }

    return res;
}
