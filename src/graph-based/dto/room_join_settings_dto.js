
export default (entity = {}) => {
    return {
        join_channel_uuid: entity.join_channel_uuid || null,
        join_message: entity.join_message,
    };
}
