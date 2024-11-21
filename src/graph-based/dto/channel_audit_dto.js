import dateHelper from './_date_helper.js';
export default (entity = {}) => {
    return dateHelper(entity, { 
        uuid: entity.uuid,
        body: entity.body,
        channel_audit_type_name: entity.channel_audit_type?.name, 
        channel_uuid: entity.channel?.uuid,
        room_uuid: entity.room?.uuid,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    });
}
