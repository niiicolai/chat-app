
export default (entity = {}, eagerRelationships = []) => {
    const email_verified = eagerRelationships.find((rel) => rel.user_email_verification)?.user_email_verification?.is_verified || null;
    const user_status = eagerRelationships.find((rel) => rel.user_status)?.user_status || null;

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
        dto.user_status = user_status;
    }

    if (entity.created_at && entity.created_at.year) {
        dto.created_at = `${entity.created_at.year.low}-${entity.created_at.month.low}-${entity.created_at.day.low}T${entity.created_at.hour.low}:${entity.created_at.minute.low}:${entity.created_at.second.low}.${entity.created_at.nanosecond.low}`;
    } else if (typeof entity.created_at === 'string') {
        dto.created_at = entity.created_at;
    }

    if (entity.updated_at && entity.updated_at.year) {
        dto.updated_at = `${entity.updated_at.year.low}-${entity.updated_at.month.low}-${entity.updated_at.day.low}T${entity.updated_at.hour.low}:${entity.updated_at.minute.low}:${entity.updated_at.second.low}.${entity.updated_at.nanosecond.low}`;
    } else if (typeof entity.updated_at === 'string') {
        dto.updated_at = entity.updated_at;
    }

    return dto;
}
