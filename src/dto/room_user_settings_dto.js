
export default (entity = {}, type = 'mysql') => {
    const res = {};
    
    if (type === 'mysql') {
        if (entity.max_users) res.max_users = entity.max_users;
    }
    else if (type === 'mongodb') {
        if (entity.max_users) res.max_users = entity.max_users;
    }
    else if (type === 'neo4j') {
        console.warn('neo4j: not implemented yet');
    }

    return res;
}
