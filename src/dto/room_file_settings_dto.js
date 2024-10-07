
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}total_files_bytes_allowed`]: total_files_bytes_allowed,
        [`${prefix}single_file_bytes_allowed`]: single_file_bytes_allowed,
        [`${prefix}file_days_to_live`]: file_days_to_live,
        [`${prefix}total_files_mb`]: total_files_mb,
        [`${prefix}single_file_mb`]: single_file_mb,
    } = entity;

    if (!total_files_bytes_allowed) throw new Error(`room_dto: ${prefix}total_files_bytes_allowed is required`);
    if (!single_file_bytes_allowed) throw new Error(`room_dto: ${prefix}single_file_bytes_allowed is required`);
    if (!file_days_to_live) throw new Error(`room_dto: ${prefix}file_days_to_live is required`);
    if (!total_files_mb) throw new Error(`room_dto: ${prefix}total_files_mb is required`);
    if (!single_file_mb) throw new Error(`room_dto: ${prefix}single_file_mb is required`);

    return { 
        total_files_bytes_allowed,
        single_file_bytes_allowed,
        file_days_to_live,
        total_files_mb: parseFloat(total_files_mb),
        single_file_mb: parseFloat(single_file_mb),
    };
}
