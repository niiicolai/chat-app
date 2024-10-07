
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}max_channels`]: max_channels,
        [`${prefix}message_days_to_live`]: message_days_to_live,
    } = entity;

    if (!max_channels) throw new Error(`room_dto: ${prefix}max_channels is required`);
    if (!message_days_to_live) throw new Error(`room_dto: ${prefix}message_days_to_live is required`);

    return { 
        max_channels,
        message_days_to_live,
    };
}
