import { stringify } from 'uuid';

export default (entity = {}) => {
    return {
        uuid: !(entity._id instanceof Buffer) ? entity._id : stringify(entity._id),
        channel_message_upload_type_name: entity.channel_message_upload_type,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
