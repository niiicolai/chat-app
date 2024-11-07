
export default (entity = {}) => {
    return {
        uuid: entity.uuid,
        last_seen_at: entity.last_seen_at,
        message: entity.message,
        total_online_hours: entity.total_online_hours,
        user_status_state_name: entity.user_status_state?.name,
        user_uuid: entity.user?.uuid,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
