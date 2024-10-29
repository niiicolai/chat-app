import dateHelper from './_date_helper.js';

export default (entity = {}) => {
    return dateHelper(entity, { name: entity.name });
}
