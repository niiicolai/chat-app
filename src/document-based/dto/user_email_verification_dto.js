import { stringify } from "uuid";

export default (entity = {}) => {
    return {
        uuid: !(entity._id instanceof Buffer) ? entity._id : stringify(entity._id),
        user_uuid: !(entity.user?._id instanceof Buffer) ? entity.user?._id : stringify(entity.user?._id),
        is_verified: entity.user_email_verification?.is_verified,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
