
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}uuid`]: uuid,

        [`${prefix}created_at`]: created_at,
        [`${prefix}updated_at`]: updated_at,
    } = entity;

    if (!uuid) throw new Error(`channel_webhook_message_dto: ${prefix}uuid is required`);

    const res = { 
        uuid,
    };

    if (created_at) res.created_at = created_at;
    if (updated_at) res.updated_at = updated_at;

    return res;
}
