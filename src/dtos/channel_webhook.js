
export default (entity) => {

    const dto = {
        uuid: entity.channel_webhook_uuid,
        channel_uuid: entity.channel_webhook_channel_uuid,
        created_at: entity.channel_webhook_created_at,
        updated_at: entity.channel_webhook_updated_at
    }

    if (entity.channel_uuid) {
        dto.channel = {
            uuid: entity.channel_uuid,
            name: entity.channel_name,
            description: entity.channel_description,
            room_uuid: entity.channel_room_uuid,
            channel_type_name: entity.channel_channel_type_name,
            created_at: entity.channel_created_at,
            updated_at: entity.channel_updated_at
        }
    }

    return dto;
}
