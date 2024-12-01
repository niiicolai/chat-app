import mongoose from "mongoose";

export default (entity = {}) => {
    console.log('entity', entity);
    // cast _id to uuid
    const uuid = mongoose.Types.UUID(entity._id).toString();
    return {
        uuid: uuid,
        last_seen_at: entity.last_seen_at,
        message: entity.message,
        total_online_hours: entity.total_online_hours,
        user_status_state_name: entity.user_status_state,
        user_uuid: entity.user?._id,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
