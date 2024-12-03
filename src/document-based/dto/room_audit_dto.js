import { stringify } from 'uuid';

export default (entity = {}) => {
    return {
        uuid: !(entity._id instanceof Buffer) ? entity._id : stringify(entity._id),
        body: entity.body,
        room_audit_type_name: entity?.room_audit_type,
        room_uuid: !(entity?.room?._id instanceof Buffer) ? entity?.room?._id : stringify(entity?.room?._id),
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
