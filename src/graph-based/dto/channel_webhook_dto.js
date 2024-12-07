import roomFileDto from './room_file_dto.js';
import dateHelper from './_date_helper.js';

export default (entity = {}) => {
    const dto = {
        uuid: entity.uuid,
        name: entity.name,
        description: entity.description,
        channel_uuid: entity.channel?.uuid,
    };

    if (entity.roomFile) {
        dto.room_file = roomFileDto({
            ...entity.roomFile,
            room: entity.channel?.room,
            roomFileType: entity.roomFile?.roomFileType,
        });
    }

    return dateHelper(entity, dto);
}
