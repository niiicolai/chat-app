import userStatusDto from './user_status_dto.js';
import { stringify } from "uuid";

export default (entity = {}) => {
    const dto = {
        uuid: !(entity._id instanceof Buffer) ? entity._id : stringify(entity._id),
        username: entity.username,
        email: entity.email,
        email_verified: entity.user_email_verification?.is_verified,
        avatar_src: entity.avatar_src,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };

    if (entity.user_status) dto.status = userStatusDto(entity.user_status);

    return dto;
}
