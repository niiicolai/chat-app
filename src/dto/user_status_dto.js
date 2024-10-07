
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}uuid`]: uuid,
        [`${prefix}last_seen_at`]: last_seen_at,
        [`${prefix}message`]: message,
        [`${prefix}total_online_hours`]: total_online_hours,
        [`${prefix}user_status_state`]: user_status_state,
        [`${prefix}user_uuid`]: user_uuid,
        [`${prefix}created_at`]: created_at,
        [`${prefix}updated_at`]: updated_at,
    } = entity;

    if (!uuid) throw new Error(`user_dto: ${prefix}uuid is required`);
    if (!last_seen_at) throw new Error(`user_dto: ${prefix}last_seen_at is required`);
    if (!message) throw new Error(`user_dto: ${prefix}message is required`);
    if (!total_online_hours) throw new Error(`user_dto: ${prefix}total_online_hours is required`);
    if (!user_status_state) throw new Error(`user_dto: ${prefix}user_status_state is required`);
    if (!user_uuid) throw new Error(`user_dto: ${prefix}user_uuid is required`);

    const res = { 
        uuid,
        last_seen_at,
        message,
        total_online_hours,
        user_status_state,
        user_uuid,
    };

    if (created_at) res.created_at = created_at;
    if (updated_at) res.updated_at = updated_at;

    return res;
}
