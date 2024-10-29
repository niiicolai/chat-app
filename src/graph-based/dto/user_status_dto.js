import dateHelper from './_date_helper.js';

export default (entity = {}, eagerRelationships = []) => {
    const user_status_state = eagerRelationships.find((rel) => rel.user_status_state)?.user_status_state || {};
    const user_status_state_name = user_status_state.name || null;

    return dateHelper(entity, {
        uuid: entity.uuid,
        last_seen_at: entity.last_seen_at,
        message: entity.message,
        total_online_hours: entity.total_online_hours,
        user_status_state_name,
        user_uuid: entity.user_uuid
    });
}
