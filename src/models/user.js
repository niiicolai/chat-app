import BaseModel from './base_model.js';
import bcrypt from 'bcrypt';

/**
 * @class UserModel
 * @description Model for users
 * @extends BaseModel
 */
class UserModel extends BaseModel {

    /**
     * @constructor
     * @description Constructor for UserModel
     */
    constructor() {
        super({
            singularName: 'user',
            pluralName: 'users',
            mysql_table: 'user',
            pk: 'uuid',
            fields: [
                'username',
                'email',
                'password',
            ]
        });
    }

    /**
     * @function create
     * @description Create a new user
     * @param {Object} user
     * @returns {Promise}
     */
    async create(user) {
        const saltRounds = 10;
        const hash = await bcrypt.hash(user.password, saltRounds);
        return await super.create({ ...user, password: hash });
    }

    /**
     * @function update
     * @description Update a user
     * @param {Object} user
     * @returns {Promise}
     */
    async update(user) {
        if (user.password) {
            const saltRounds = 10;
            const hash = await bcrypt.hash(user.password, saltRounds);
            return await super.update({ ...user, password: hash });
        }
        return await super.update(user);
    }

    /**
     * @function comparePassword
     * @description Compare the user's password with a given password
     * @param {Object} user
     * @param {String} password
     * @returns {Promise}
     */
    async comparePassword(user, password) {
        return await bcrypt.compare(password, user.password);
    }
}

// Define the model
const model = new UserModel();

// Export the model
export default model;
