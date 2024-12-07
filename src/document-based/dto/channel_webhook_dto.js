import roomFileDto from './room_file_dto.js';
import { stringify } from 'uuid';

export default (entity = {}) => {
    const dto = {
        uuid: !(entity._id instanceof Buffer) ? entity._id : stringify(entity._id),
        name: entity.name,
        description: entity.description,
        room_uuid: !(entity.room?._id instanceof Buffer) ? entity.room?._id : stringify(entity.room?._id),
        channel_uuid: !(entity.channel?._id instanceof Buffer) ? entity.channel?._id : stringify(entity.channel?._id),
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };

    if (entity.room_file) {
        dto.room_file = roomFileDto(entity.room_file);
    }

    return dto;
}
