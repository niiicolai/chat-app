import { stringify } from "uuid";

export default (entity = {}) => {
    return {
        uuid: !(entity._id instanceof Buffer) ? entity._id : stringify(entity._id),
        user_login_type_name: entity.user_login_type,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
