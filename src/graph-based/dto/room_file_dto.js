import userDto from './user_dto.js';
import channelMessageUploadDto from './channel_message_upload_dto.js';
import dateHelper from './_date_helper.js';

export default (entity = {}, relations=[]) => {
    const room = relations.find(relation => relation.room)?.room;
    const roomFileType = relations.find(relation => relation.roomFileType)?.roomFileType;
    const user = relations.find(relation => relation.user)?.user;
    const channelMessageUpload = relations.find(relation => relation.channelMessageUpload)?.channelMessageUpload;
    const channelMessageUploadType = relations.find(relation => relation.channelMessageUploadType)?.channelMessageUploadType;
    const channelMessage = relations.find(relation => relation.channelMessage)?.channelMessage;

    const dto = {
        uuid: entity.uuid,
        src: entity.src,
        size: entity?.size?.low || entity.size,
    };

    if (dto.size) {
        dto.size_mb = parseFloat(dto.size / 1024 / 1024).toFixed(2);
    }

    if (room) {
        dto.room_uuid = room.uuid;
    }

    if (roomFileType) {
        dto.room_file_type_name = roomFileType.name;
    }

    if (user) {
        dto.user = userDto(user);
    }

    if (channelMessageUpload) {
        dto.channel_message_upload = channelMessageUploadDto(channelMessageUpload, [ 
            { channelMessageUploadType },
            { channelMessage }
        ]);
    }

    return dateHelper(entity, dto);
}
