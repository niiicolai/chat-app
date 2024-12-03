import userDto from './user_dto.js';
import { stringify } from 'uuid';

export default (entity = {}) => {
    const dto = {
        uuid: !(entity._id instanceof Buffer) ? entity._id : stringify(entity._id),
        user_uuid: !(entity.user?._id instanceof Buffer) ? entity.user?._id : stringify(entity.user._id),
        room_uuid: !(entity.room?._id instanceof Buffer) ? entity.room?._id : stringify(entity.room._id),
        room_user_role_name: entity.room_user_role,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };

    if (entity.user) {
        dto.user = userDto(entity.user);
        delete dto.user.email;
    }

    return dto;
}
