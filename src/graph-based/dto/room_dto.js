import roomAvatarDto from './room_avatar_dto.js';
import roomJoinSettingsDto from './room_join_settings_dto.js';
import roomRulesSettingsDto from './room_rules_settings_dto.js';
import roomUserSettingsDto from './room_user_settings_dto.js';
import roomChannelSettingsDto from './room_channel_settings_dto.js';
import roomFileSettingsDto from './room_file_settings_dto.js';
import roomFileDto from './room_file_dto.js';

export default (entity = {}) => {
    const dto = {
        uuid: entity.uuid,
        name: entity.name,
        description: entity.description,
        room_category_name: entity.room_category?.name,
        bytes_used: entity.bytes_used,
        mb_used: entity.mb_used,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };

    if (entity.room_avatar) {
        dto.avatar = roomAvatarDto(entity.room_avatar);
        
        if (entity.room_avatar.room_file) {
            dto.avatar.room_file = roomFileDto(entity.room_avatar.room_file);
        }
    }

    if (entity.room_join_settings) dto.joinSettings = roomJoinSettingsDto(entity.room_join_settings);
    if (entity.room_rules_settings) dto.rulesSettings = roomRulesSettingsDto(entity.room_rules_settings);
    if (entity.room_user_settings) dto.userSettings = roomUserSettingsDto(entity.room_user_settings);
    if (entity.room_channel_settings) dto.channelSettings = roomChannelSettingsDto(entity.room_channel_settings);
    if (entity.room_file_settings) dto.fileSettings = roomFileSettingsDto(entity.room_file_settings);

    return dto;
}
