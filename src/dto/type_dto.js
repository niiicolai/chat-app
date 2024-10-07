
export default (entity = {}, prefix='') => {
    const {
        [`${prefix}name`]: name,
        [`${prefix}created_at`]: created_at,
        [`${prefix}updated_at`]: updated_at,
    } = entity;

    if (!name) throw new Error(`type_dto: ${prefix}name is required`);
    if (!created_at) throw new Error(`type_dto: ${prefix}created_at is required`);
    if (!updated_at) throw new Error(`type_dto: ${prefix}updated_at is required`);

    return { name, created_at, updated_at };
}
