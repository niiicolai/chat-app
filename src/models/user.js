import BaseModel from './base_model.js';
import bcrypt from 'bcrypt';
import ControllerError from '../errors/controller_error.js';

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
    create(options={body: null}) {
        const { body } = options;
        if (!body) return super.create(options);
        const saltRounds = 10;
        const hash = bcrypt.hashSync(body.password, saltRounds);
        return super.create({ ...options, ...{ body: { ...body, password: hash } } });
    }

    /**
     * @function update
     * @description Update a user
     * @param {Object} user
     * @returns {Promise}
     */
    update(options={body: null}) {
        const { body } = options;
        if (!body) return super.update(options);

        if (body.password) {
            const saltRounds = 10;
            const hash = bcrypt.hashSync(body.password, saltRounds);
            body.password = hash;
        }

        return super.update(options);
    }

    /**
     * @function comparePassword
     * @description Compare the user's password with a given password
     * @param {Object} user
     * @param {String} password
     * @returns {Promise}
     */
    async throwIfNoPasswordMatch(password1, password2) {
        if (!await bcrypt.compare(password1, password2)) {
            throw new ControllerError(400, 'Invalid password');
        }
    }
}

// Define the model
const model = new UserModel();

// Export the model
export default model;
