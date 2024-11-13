import roomFileDto from './room_file_dto.js';
import dateHelper from './_date_helper.js';

export default (entity = {}, eagerRelationships = []) => {
    const roomFile = eagerRelationships.find((rel) => rel.room_file)?.room_file || null;
    const room = eagerRelationships.find((rel) => rel.room)?.room || null;

    const dto = {
        uuid: entity.uuid,
        room_file_uuid: roomFile?.uuid,
        room_uuid: room?.uuid,
    };

    if (roomFile) dto.room_file = roomFileDto(roomFile);

    return dateHelper(entity, dto);
}
