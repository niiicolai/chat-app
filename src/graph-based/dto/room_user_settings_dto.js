
export default (entity = {}) => {
    return {
        max_users: entity.max_users?.low || entity.max_users,
    };
}
