import roomAvatarDto from './room_avatar_dto.js';
import roomJoinSettingsDto from './room_join_settings_dto.js';
import roomRulesSettingsDto from './room_rules_settings_dto.js';
import roomUserSettingsDto from './room_user_settings_dto.js';
import roomChannelSettingsDto from './room_channel_settings_dto.js';
import roomFileSettingsDto from './room_file_settings_dto.js';
import roomFileDto from './room_file_dto.js';
import dateHelper from './_date_helper.js';

export default (entity = {}) => {

    const dto = {
        uuid: entity.uuid,
        name: entity.name,
        description: entity.description,
        bytes_used: entity.bytes_used || 0,
        mb_used: entity.mb_used || 0,
    };

    if (entity.roomCategory) dto.room_category_name = entity.roomCategory.name;
    if (entity.roomJoinSettings) dto.joinSettings = roomJoinSettingsDto(entity.roomJoinSettings);
    if (entity.roomRulesSettings) dto.rulesSettings = roomRulesSettingsDto(entity.roomRulesSettings);
    if (entity.roomUserSettings) dto.userSettings = roomUserSettingsDto(entity.roomUserSettings);
    if (entity.roomChannelSettings) dto.channelSettings = roomChannelSettingsDto(entity.roomChannelSettings);
    if (entity.roomFileSettings) dto.fileSettings = roomFileSettingsDto(entity.roomFileSettings);
    if (entity.roomAvatar) dto.avatar = roomAvatarDto({
        room: { uuid: entity.uuid },
        ...entity.roomAvatar,
        ...(entity.roomAvatar.roomFile && { 
            roomFile: entity.roomAvatar.room_file 
        }),
    });

    return dateHelper(entity, dto);
}
