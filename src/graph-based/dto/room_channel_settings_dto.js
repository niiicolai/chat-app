
export default (entity = {}) => {
    return {
        max_channels: entity.max_channels.low,
        message_days_to_live: entity.message_days_to_live.low,
    };
}
