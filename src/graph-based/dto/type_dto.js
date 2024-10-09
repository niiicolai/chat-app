
export default (entity = {}) => {
    return {
        name: entity.name,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
