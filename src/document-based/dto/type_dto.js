
export default (entity = {}) => {
    return {
        name: entity._id,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
