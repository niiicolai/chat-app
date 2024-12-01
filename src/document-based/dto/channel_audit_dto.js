import { stringify } from "uuid";

export default (entity = {}) => {
    return { 
        uuid: stringify(entity._id),
        body: entity.body,
        channel_audit_type_name: entity.channel_audit_type, 
        channel_uuid: entity.channel?.uuid,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
