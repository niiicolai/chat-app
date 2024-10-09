
export default (entity = {}, prefix = '') => {
    return {
        name: entity[`${prefix}name`],
        created_at: entity[`${prefix}created_at`],
        updated_at: entity[`${prefix}updated_at`],
    }
}
