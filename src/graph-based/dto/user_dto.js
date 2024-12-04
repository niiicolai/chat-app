import dateHelper from './_date_helper.js';
import userStatusDto from './user_status_dto.js';

export default (entity = {}) => {
    const dto = {
        uuid: entity.uuid,
        username: entity.username,
        email: entity.email,
        avatar_src: entity.avatar_src,
    };

    if (entity.user_email_verification) {
        dto.email_verified = entity.user_email_verification.is_verified;
    }

    if (entity.user_status) {
        dto.user_status = userStatusDto({
            ...entity.user_status,
            user_status_state: entity.user_status_state,
            user: entity,
        });
    }

    return dateHelper(entity, dto);
}
