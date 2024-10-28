
export default (entity = {}) => {
    return {
        total_files_bytes_allowed: entity.total_files_bytes_allowed.low,
        single_file_bytes_allowed: entity.single_file_bytes_allowed.low,
        file_days_to_live: entity.file_days_to_live.low,
        total_files_mb: parseFloat(entity.total_files_bytes_allowed.low / 1024 / 1024),
        single_file_mb: parseFloat(entity.single_file_bytes_allowed.low / 1024 / 1024),
    };
}
