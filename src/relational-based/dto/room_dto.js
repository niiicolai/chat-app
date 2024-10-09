import roomJoinSettingsDto from './room_join_settings_dto.js';
import roomRulesSettingsDto from './room_rules_settings_dto.js';
import roomUserSettingsDto from './room_user_settings_dto.js';
import roomChannelSettingsDto from './room_channel_settings_dto.js';
import roomFileSettingsDto from './room_file_settings_dto.js';
import roomAvatarDto from './room_avatar_dto.js';
import roomFileDto from './room_file_dto.js';

export default (entity = {}) => {
    const dto = {
        uuid: entity.room_uuid,
        name: entity.room_name,
        description: entity.room_description,
        room_category_name: entity.room_category_name,
        bytes_used: entity.bytes_used,
        mb_used: entity.mb_used,
        created_at: entity.room_created_at,
        updated_at: entity.room_updated_at,
    };

    if (entity.room_join_settings_uuid) {
        dto.joinSettings = roomJoinSettingsDto(entity);
    }

    if (entity.room_rules_settings_uuid) {
        dto.rulesSettings = roomRulesSettingsDto(entity);
    }

    if (entity.room_user_settings_uuid) {
        dto.userSettings = roomUserSettingsDto(entity);
    }

    if (entity.room_channel_settings_uuid) {
        dto.channelSettings = roomChannelSettingsDto(entity);
    }

    if (entity.room_file_settings_uuid) {
        dto.fileSettings = roomFileSettingsDto(entity);
    }

    if (entity.room_avatar_uuid) {
        dto.avatar = roomAvatarDto(entity);

        if (entity.room_file_uuid) {
            dto.avatar.room_file = roomFileDto(entity);
        }
    }

    return dto;
}
