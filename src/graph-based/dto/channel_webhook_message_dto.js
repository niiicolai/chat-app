
export default (entity = {}) => {
    return {
        uuid: entity.uuid,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
    };
}
