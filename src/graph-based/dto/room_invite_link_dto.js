import dateHelper from './_date_helper.js';

export default (entity = {}) => {
    return dateHelper(entity, {
        uuid: entity.uuid,
        room_uuid: entity.room_uuid,
        expires_at: entity.expires_at || null,
        never_expires: (entity.expires_at === null || entity.expires_at === undefined),
    });
}
