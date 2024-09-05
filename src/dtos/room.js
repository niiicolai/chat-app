import roomSettingDto from './room_setting.js';

export default (entity) => {

    const dto = {
        uuid: entity.room_uuid,
        name: entity.room_name,
        description: entity.room_description,
        room_category_name: entity.room_room_category_name,
        avatar_src: entity.room_avatar_src,
        created_at: entity.room_created_at,
        updated_at: entity.room_updated_at
    }

    if (entity.room_setting_uuid) {
        dto.setting =  roomSettingDto(entity);
    }

    return dto;
}
