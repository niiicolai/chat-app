import roomFileDto from './room_file_dto.js';
import dateHelper from './_date_helper.js';

export default (entity = {}, relations=[]) => {
    const channelType = relations.find(relation => relation.channelType)?.channelType;
    const roomFile = relations.find(relation => relation.roomFile)?.roomFile;
    const room = relations.find(relation => relation.room)?.room;

    const dto = { 
        uuid: entity.uuid,
        name: entity.name,
        description: entity.description,
    };

    if (roomFile) {
        dto.room_file = roomFileDto(roomFile);
    }

    if (channelType) {
        dto.channel_type_name = channelType.name;
    }

    if (room) {
        dto.room_uuid = room.uuid;
    }

    return dateHelper(entity, dto);
}
