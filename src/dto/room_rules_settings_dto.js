
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}rules_text`]: rules_text,
    } = entity;

    if (!rules_text) throw new Error(`room_dto: ${prefix}rules_text is required`);

    return { 
        rules_text,
    };
}
