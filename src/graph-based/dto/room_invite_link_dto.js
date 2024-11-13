import dateHelper from './_date_helper.js';

export default (entity = {}, relations=[]) => {
    const room = relations.find((rel) => rel.room)?.room
    const dto = { uuid: entity.uuid };

    if (entity.expires_at && typeof entity.expires_at === 'object') {
        dto.expires_at = `${entity.expires_at.year.low}-${entity.expires_at.month.low}-${entity.expires_at.day.low}T${entity.expires_at.hour.low}:${entity.expires_at.minute.low}:${entity.expires_at.second.low}.${entity.expires_at.nanosecond.low}`;
    } else if (entity.expires_at && typeof entity.expires_at === 'string') {
        dto.expires_at = entity.expires_at;
    } else {
        dto.expires_at = null;
    }

    dto.never_expires = (entity.expires_at === null || entity.expires_at === undefined);


    if (room) dto.room_uuid = room.uuid;

    return dateHelper(entity, dto);
}
