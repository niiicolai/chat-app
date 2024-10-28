import roomAvatarDto from './room_avatar_dto.js';
import roomJoinSettingsDto from './room_join_settings_dto.js';
import roomRulesSettingsDto from './room_rules_settings_dto.js';
import roomUserSettingsDto from './room_user_settings_dto.js';
import roomChannelSettingsDto from './room_channel_settings_dto.js';
import roomFileSettingsDto from './room_file_settings_dto.js';
import roomFileDto from './room_file_dto.js';

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

    if (entity.created_at && entity.created_at.year) {
        dto.created_at = `${entity.created_at.year.low}-${entity.created_at.month.low}-${entity.created_at.day.low}T${entity.created_at.hour.low}:${entity.created_at.minute.low}:${entity.created_at.second.low}.${entity.created_at.nanosecond.low}`;
    } else if (typeof entity.created_at === 'string') {
        dto.created_at = entity.created_at;
    }

    if (entity.updated_at && entity.updated_at.year) {
        dto.updated_at = `${entity.updated_at.year.low}-${entity.updated_at.month.low}-${entity.updated_at.day.low}T${entity.updated_at.hour.low}:${entity.updated_at.minute.low}:${entity.updated_at.second.low}.${entity.updated_at.nanosecond.low}`;
    } else if (typeof entity.updated_at === 'string') {
        dto.updated_at = entity.updated_at;
    }

    return dto;
}
