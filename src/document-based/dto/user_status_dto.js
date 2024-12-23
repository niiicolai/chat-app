import { stringify } from "uuid";

export default (entity = {}) => {
    return {
        uuid: !(entity._id instanceof Buffer) ? entity?._id : stringify(entity._id),
        user_uuid: !(entity.user?._id instanceof Buffer) ? entity.user?._id : stringify(entity.user?._id),
        last_seen_at: entity.last_seen_at,
        message: entity.message,
        total_online_hours: entity.total_online_hours,
        user_status_state_name: entity.user_status_state,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
