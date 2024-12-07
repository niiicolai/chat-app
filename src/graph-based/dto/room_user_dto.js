import userDto from './user_dto.js';
import dateHelper from './_date_helper.js';

export default (entity = {}) => {
    const dto = { uuid: entity.uuid };

    if (entity.user) {
        dto.user = userDto(entity.user);
        dto.user_uuid = entity.user.uuid;
        delete dto.user.email;
    }

    if (entity.room) {
        dto.room_uuid = entity.room.uuid;
    }

    if (entity.role) {
        dto.room_user_role_name = entity.role;
    }

    return dateHelper(entity, dto);
}
