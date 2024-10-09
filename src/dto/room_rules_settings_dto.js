
export default (entity = {}, type = 'mysql') => {
    const res = {};
    
    if (type === 'mysql') {
        if (entity.rules_text) res.rules_text = entity.rules_text;
    }
    else if (type === 'mongodb') {
        if (entity.rules_text) res.rules_text = entity.rules_text;
    }
    else if (type === 'neo4j') {
        console.warn('neo4j: not implemented yet');
    }

    return res;
}
