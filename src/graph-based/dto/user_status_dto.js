import dateHelper from './_date_helper.js';

export default (entity = {}) => {
    const dto = {};

    if (entity.last_seen_at && typeof entity.created_at === 'object') {
        dto.last_seen_at = `${entity.last_seen_at.year.low}-${entity.last_seen_at.month.low}-${entity.last_seen_at.day.low}T${entity.last_seen_at.hour.low}:${entity.last_seen_at.minute.low}:${entity.last_seen_at.second.low}.${entity.last_seen_at.nanosecond.low}`;
    } else if (entity.last_seen_at && typeof entity.last_seen_at === 'string') {
        dto.last_seen_at = entity.last_seen_at;
    }

    return dateHelper(entity, {
        ...dto,
        uuid: entity.uuid,
        message: entity.message,
        total_online_hours: entity.total_online_hours,
        user_status_state_name: entity.user_status_state.name,
        user_uuid: entity.user.uuid,
    });
}
