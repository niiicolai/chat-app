import dateHelper from './_date_helper.js';

export default (entity = {}) => {
    const dto = {
        uuid: entity.uuid,
        user_login_type_name: entity.user_login_type?.name,
    };

    return dateHelper(entity, dto);
}
