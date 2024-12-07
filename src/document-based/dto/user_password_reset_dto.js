import { stringify } from "uuid";

export default (entity = {}) => {
    return {
        uuid: !(entity._id instanceof Buffer) ? entity._id : stringify(entity._id),
        user_uuid: !(entity.user?._id instanceof Buffer) ? entity.user?._id : stringify(entity.user?._id),
        expires_at: entity.expires_at,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
