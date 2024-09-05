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
                'avatar_src',
            ],
            requiredFields: [
                'username',
                'email',
                'password',
            ],
            create_timestamp: 'created_at',
            update_timestamp: 'updated_at',
        });
    }

    /**
     * @function create
     * @description Create a new user
     * @param {Object} body
     * @returns {Promise}
     */
    async create(body) {
        const saltRounds = 10;
        const hash = await bcrypt.hash(body.password, saltRounds);
        return await super.create({ ...body, password: hash });
    }

    /**
     * @function update
     * @description Update a user
     * @param {Object} user
     * @returns {Promise}
     */
    async update(options) {
        if (options.body.password) {
            const saltRounds = 10;
            options.body.password = await bcrypt.hash(options.body.password, saltRounds);
        }

        return await super.update(options);
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
