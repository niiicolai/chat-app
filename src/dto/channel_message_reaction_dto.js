
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}uuid`]: uuid,
        [`${prefix}reaction`]: reaction,
        [`user_uuid`]: user_uuid,
        [`channel_message_uuid`]: channel_message_uuid,
        [`${prefix}created_at`]: created_at,
        [`${prefix}updated_at`]: updated_at,
    } = entity;

    if (!uuid) throw new Error(`channel_message_reaction_dto: ${prefix}uuid is required`);
    if (!reaction) throw new Error(`channel_message_reaction_dto: ${prefix}reaction is required`);
    if (!user_uuid) throw new Error(`channel_message_reaction_dto: user_uuid is required`);
    if (!channel_message_uuid) throw new Error(`channel_message_reaction_dto: channel_message_uuid is required`);
    if (!created_at) throw new Error(`channel_message_reaction_dto: ${prefix}created_at is required`);
    if (!updated_at) throw new Error(`channel_message_reaction_dto: ${prefix}updated_at is required`);

    return { 
        uuid, 
        reaction,
        user_uuid,
        channel_message_uuid,
        created_at, 
        updated_at 
    };
}
