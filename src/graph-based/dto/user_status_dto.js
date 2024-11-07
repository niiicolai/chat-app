import dateHelper from './_date_helper.js';

export default (entity = {}, eagerRelationships = []) => {
    const user_status_state = eagerRelationships.find((rel) => rel.user_status_state)?.user_status_state || {};
    const user_status_state_name = user_status_state.name || null;
    const user = eagerRelationships.find((rel) => rel.user)?.user || null;
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
        user_status_state_name,
        user_uuid: user?.uuid,
    });
}
