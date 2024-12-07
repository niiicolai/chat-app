import dateHelper from './_date_helper.js';

export default (entity = {}) => {
    return dateHelper(entity, {
        uuid: entity.uuid,
        body: entity.body,
        room_audit_type_name: entity.room_audit_type?.name,
        room_uuid: entity.room?.uuid,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    });
}
