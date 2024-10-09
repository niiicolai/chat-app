
export default (entity = {}) => {
    return {
        uuid: entity.user_status_uuid,
        last_seen_at: entity.user_status_last_seen_at,
        message: entity.user_status_message,
        total_online_hours: entity.user_status_total_online_hours,
        user_status_state_name: entity.user_status_state_name,
        user_uuid: entity.user_uuid,
        created_at: entity.user_status_created_at,
        updated_at: entity.user_status_updated_at,
    };
}
