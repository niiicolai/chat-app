import roomAvatarDto from './room_avatar_dto.js';
import roomJoinSettingsDto from './room_join_settings_dto.js';
import roomRulesSettingsDto from './room_rules_settings_dto.js';
import roomUserSettingsDto from './room_user_settings_dto.js';
import roomChannelSettingsDto from './room_channel_settings_dto.js';
import roomFileSettingsDto from './room_file_settings_dto.js';
import roomFileDto from './room_file_dto.js';
import dateHelper from './_date_helper.js';

export default (entity = {}, eagerRelationships = []) => {
    const roomCategory = eagerRelationships.find((rel) => rel.roomCategory)?.roomCategory || null;
    const roomAvatar = eagerRelationships.find((rel) => rel.roomAvatar)?.roomAvatar || null;
    const roomJoinSettings = eagerRelationships.find((rel) => rel.roomJoinSettings)?.roomJoinSettings || null;
    const roomRulesSettings = eagerRelationships.find((rel) => rel.roomRulesSettings)?.roomRulesSettings || null;
    const roomUserSettings = eagerRelationships.find((rel) => rel.roomUserSettings)?.roomUserSettings || null;
    const roomChannelSettings = eagerRelationships.find((rel) => rel.roomChannelSettings)?.roomChannelSettings || null;
    const roomFileSettings = eagerRelationships.find((rel) => rel.roomFileSettings)?.roomFileSettings || null;
    
    const dto = {
        uuid: entity.uuid,
        name: entity.name,
        description: entity.description,
        bytes_used: entity.bytes_used,
        mb_used: entity.mb_used,
    };

    if (roomCategory) dto.room_category_name = roomCategory.name;
    if (roomAvatar) {
        dto.avatar = roomAvatarDto(roomAvatar);
        
        if (roomAvatar.room_file) {
            dto.avatar.room_file = roomFileDto(roomAvatar.room_file);
        }
    }

    if (roomJoinSettings) dto.joinSettings = roomJoinSettingsDto(roomJoinSettings);
    if (roomRulesSettings) dto.rulesSettings = roomRulesSettingsDto(roomRulesSettings);
    if (roomUserSettings) dto.userSettings = roomUserSettingsDto(roomUserSettings);
    if (roomChannelSettings) dto.channelSettings = roomChannelSettingsDto(roomChannelSettings);
    if (roomFileSettings) dto.fileSettings = roomFileSettingsDto(roomFileSettings);

    return dateHelper(entity, dto);
}
