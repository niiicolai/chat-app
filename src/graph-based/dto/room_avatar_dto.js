
export default (entity = {}) => {
    const dto = {
        uuid: entity.uuid,
        room_file_uuid: entity?.room_file?.uuid,
        room_uuid: entity?.room?.uuid,
    };

    if (entity.created_at && entity.created_at.year) {
        dto.created_at = `${entity.created_at.year.low}-${entity.created_at.month.low}-${entity.created_at.day.low}T${entity.created_at.hour.low}:${entity.created_at.minute.low}:${entity.created_at.second.low}.${entity.created_at.nanosecond.low}`;
    } else if (typeof entity.created_at === 'string') {
        dto.created_at = entity.created_at;
    }

    if (entity.updated_at && entity.updated_at.year) {
        dto.updated_at = `${entity.updated_at.year.low}-${entity.updated_at.month.low}-${entity.updated_at.day.low}T${entity.updated_at.hour.low}:${entity.updated_at.minute.low}:${entity.updated_at.second.low}.${entity.updated_at.nanosecond.low}`;
    } else if (typeof entity.updated_at === 'string') {
        dto.updated_at = entity.updated_at;
    }

    return dto;
}
