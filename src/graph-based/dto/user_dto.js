import dateHelper from './_date_helper.js';
import userStatusDto from './user_status_dto.js';

export default (entity = {}, eagerRelationships = []) => {
    const email_verified = eagerRelationships.find((rel) => rel.user_email_verification)?.user_email_verification?.is_verified || null;
    const user_status = eagerRelationships.find((rel) => rel.user_status)?.user_status || null;
    const user_status_state = eagerRelationships.find((rel) => rel.user_status_state)?.user_status_state || {};

    const dto = {
        uuid: entity.uuid,
        username: entity.username,
        email: entity.email,
        avatar_src: entity.avatar_src,
    };

    if (email_verified) {
        dto.email_verified = email_verified;
    }

    if (user_status) {
        dto.user_status = userStatusDto(user_status, [
            { user: { uuid: entity.uuid } },
            { user_status_state }
        ]);
    }

    return dateHelper(entity, dto);
}
