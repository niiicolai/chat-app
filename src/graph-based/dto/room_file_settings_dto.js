
export default (entity = {}) => {
    const dto = {
        total_files_bytes_allowed: entity.total_files_bytes_allowed?.low || entity.total_files_bytes_allowed,
        single_file_bytes_allowed: entity.single_file_bytes_allowed?.low || entity.single_file_bytes_allowed,
        file_days_to_live: entity.file_days_to_live?.low || entity.file_days_to_live,        
    };

    dto.total_files_mb = parseFloat(dto.total_files_bytes_allowed / 1024 / 1024);
    dto.single_file_mb = parseFloat(dto.single_file_bytes_allowed / 1024 / 1024);

    return dto;
}
