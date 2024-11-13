import roomFileDto from './room_file_dto.js';
import dateHelper from './_date_helper.js';

export default (entity = {}, relations=[]) => {
    const channel = relations.find(relation => relation.channel)?.channel;
    const roomFile = relations.find(relation => relation.roomFile)?.roomFile;
    const roomFileType = relations.find(relation => relation.roomFileType)?.roomFileType;

    const dto = {
        uuid: entity.uuid,
        name: entity.name,
        description: entity.description,
    };

    if (channel) {
        dto.channel_uuid = channel.uuid;
    }

    if (roomFile) {
        dto.room_file = roomFileDto(roomFile, [{ roomFileType }]);
    }

    return dateHelper(entity, dto);
}
