
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}join_channel_uuid`]: join_channel_uuid,
        [`${prefix}join_message`]: join_message,
    } = entity;
    
    if (!join_message) throw new Error(`room_dto: ${prefix}join_message is required`);

    const res = { 
        join_message
    };

    if (join_channel_uuid) res.join_channel_uuid = join_channel_uuid;

    return res;
}
