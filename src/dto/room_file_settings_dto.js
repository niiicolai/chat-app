
export default (entity = {}, type = 'mysql') => {
    const res = {};
    
    if (type === 'mysql') {
        if (entity.total_files_bytes_allowed) res.total_files_bytes_allowed = entity.total_files_bytes_allowed;
        if (entity.single_file_bytes_allowed) res.single_file_bytes_allowed = entity.single_file_bytes_allowed;
        if (entity.file_days_to_live) res.file_days_to_live = entity.file_days_to_live;
        if (entity.total_files_mb) res.total_files_mb = entity.total_files_mb;
        if (entity.single_file_mb) res.single_file_mb = entity.single_file_mb;
    }
    else if (type === 'mongodb') {
        if (entity.total_files_bytes_allowed) res.total_files_bytes_allowed = entity.total_files_bytes_allowed;
        if (entity.single_file_bytes_allowed) res.single_file_bytes_allowed = entity.single_file_bytes_allowed;
        if (entity.file_days_to_live) res.file_days_to_live = entity.file_days_to_live;
        if (entity.total_files_mb) res.total_files_mb = entity.total_files_mb;
        if (entity.single_file_mb) res.single_file_mb = entity.single_file_mb;
    }
    else if (type === 'neo4j') {
        console.warn('neo4j: not implemented yet');
    }
    
    return res;
}
