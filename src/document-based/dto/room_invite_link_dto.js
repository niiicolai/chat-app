import { stringify } from 'uuid';

export default (entity = {}) => {
    return {
        uuid: !(entity._id instanceof Buffer) ? entity._id : stringify(entity._id),
        room_uuid: !(entity.room?._id instanceof Buffer) ? entity.room?._id : stringify(entity.room?._id),
        expires_at: entity.expires_at || null,
        never_expires: entity.expires_at ? false : true,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
