
export default (entity) => {

    return {
        name: entity.upload_type_name,
        created_at: entity.upload_type_created_at,
        updated_at: entity.upload_type_updated_at
    }
}
