import roomFileDto from './room_file_dto.js';
import dateHelper from './_date_helper.js';

export default (entity = {}) => {
    const dto = { 
        uuid: entity.uuid,
        name: entity.name,
        description: entity.description,
    };

    if (entity.roomFile) {
        dto.room_file = roomFileDto(entity.roomFile);
    }

    if (entity.channelType) {
        dto.channel_type_name = entity.channelType.name;
    }

    if (entity.room) {
        dto.room_uuid = entity.room.uuid;
    }

    return dateHelper(entity, dto);
}
