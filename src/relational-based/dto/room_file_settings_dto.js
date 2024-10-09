
export default (entity = {}) => {
    return {
        total_files_bytes_allowed: entity.total_files_bytes_allowed,
        single_file_bytes_allowed: entity.single_file_bytes_allowed,
        file_days_to_live: entity.file_days_to_live,
        total_files_mb: entity.total_files_mb,
        single_file_mb: entity.single_file_mb,
    };
}
