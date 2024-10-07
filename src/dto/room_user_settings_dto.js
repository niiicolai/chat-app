
export default (entity = {}, prefix = '') => {
    const {
        [`${prefix}max_users`]: max_users,
    } = entity;

    if (!max_users) throw new Error(`room_dto: ${prefix}max_users is required`);

    return { 
        max_users,
    };
}
