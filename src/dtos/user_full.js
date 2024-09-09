import userDTO from './user.js';


export default (entity) => {

    return {
        ...userDTO(entity),
        password: entity.user_password,
    }
}
