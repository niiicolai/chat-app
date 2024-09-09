import ControllerError from '../errors/controller_error.js';
import JwtService from './jwt_service.js';
import model from '../models/user.js';
import dto from '../dtos/user.js';
import userProfileDto from '../dtos/user_profile.js';
import userFullDto from '../dtos/user_full.js';
import StorageService from './storage_service.js';

/**
 * @constant storageService
 * @description Storage service to upload user avatars.
 */
const storageService = new StorageService('user_avatars');

/**
 * @class UserService
 * @description CRUD service for users.
 * @exports UserService
 * @requires ControllerError
 * @requires JwtService
 * @requires model
 * @requires dto
 * @requires userProfileDto
 * @requires StorageService
 */
class UserService {

    /**
     * @constructor
     */
    constructor() {
        this.model = model;
        this.dto = dto;
        this.userProfileDto = userProfileDto;
    }

    /**
     * @function template
     * @description Return the model template.
     * @returns {Object}
     */
    template() {
        return this.model.template();
    }

    /**
     * @function me
     * @description Find the user by user.sub.
     * @param {Object} user
     * @returns {Promise<Object>}
     */
    async me(user) {
        return await this.model
            .throwIfNotPresent(user, 'user is required')
            .throwIfNotPresent(user.sub, 'user.sub is required')
            .find()
            .where(model.pk, user.sub)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();
    }

    /**
     * @function findOne
     * @description Find a user by uuid.
     * @param {Object} options
     * @param {String} options.pk
     * @returns {Promise<Object>}
     */
    async findOne(options={ pk: null }) {
        await this.model
            .throwIfNotPresent(options.pk, 'Primary key value is required')
            .find()
            .where(model.pk, options.pk)
            .throwIfNotFound()
            .dto(userProfileDto)
            .executeOne();
    }

    /**
     * @function create
     * @description Create a user.
     * @param {Object} options
     * @param {Object} options.body
     * @param {Object} options.file
     * @param {Object} transaction
     * @returns {Promise<Object>}
     */
    async create(options={ body: null, file: null }, transaction) {
        const { body, file } = options
        
        /**
         * Ensure that the required fields are present
         * and that a user with the same primary key does not exist.
         */
        await model
            .throwIfNotPresent(body, 'Resource body is required')
            .throwIfNotPresent(body.email, 'Email is required')
            .throwIfNotPresent(body.password, 'Password is required')
            .throwIfNotPresent(body.username, 'Username is required')
            .throwIfNotPresent(body.uuid, 'uuid is required')
            .find()
            .where('uuid', body.uuid)
            .throwIfFound()
            .executeOne();
        
        /**
         * Ensure that the email is not already in use.
         */
        await model
            .find()
            .where('email', body.email)
            .throwIfFound()
            .executeOne();

        /**
         * Ensure that the username is not already in use.
         */
        await model
            .find()
            .where('username', body.username)
            .throwIfFound()
            .executeOne();

        /**
         * If a file is provided, upload the file
         * and set the avatar_src field to the file path.
         */
        if (file) {
            body.avatar_src = await storageService.uploadFile(file, body.uuid);
        }

        /**
         * Create the user.
         */
        await model
            .create({ body })
            .transaction(transaction)
            .execute();

        /**
         * Get the user that was created
         * and sign a JWT token for the user
         * to authenticate the user.
         */
        const user = await this.findOne({ pk: body.uuid });
        const token = JwtService.sign(body.uuid);

        /**
         * Return the user and token.
         */
        return { user, token };
    }

    /**
     * @function update
     * @description Update a user.
     * @param {Object} options
     * @param {String} options.pk
     * @param {Object} options.body
     * @param {Object} options.user
     * @param {Object} options.file
     * @param {Object} transaction
     * @returns {Promise<Object>}
     */
    async update(options={ pk: null, body: null, user: null, file: null }, transaction) {
        const { pk, body, user, file } = options;

        /**
         * Check if the required fields are present
         * and get the db record to be updated.
         */
        const current = await model
            .throwIfNotPresent(pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(body, 'Resource body is required')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where(model.pk, pk)
            .throwIfNotFound()
            .dto(userFullDto)
            .executeOne();
        
        /**
         * A user can only update their own profile.
         */
        if (user.sub !== pk) throw new ControllerError(403, 'Forbidden');

        /**
         * Ensure that the new email is not already in use.
         * If the email is not provided, use the current email.
         */
        if (body.email && body.email !== current.email) {
            await model
                .find()
                .where('email', body.email)
                .throwIfFound()
                .executeOne();
        } else body.email = current.email;

        /**
         * Ensure that the new username is not already in use.
         * If the username is not provided, use the current username.
         */
        if (body.username && body.username !== current.username) {
            await model
                .find()
                .where('username', body.username)
                .throwIfFound()
                .executeOne();
        } else body.username = current.username;

        /**
         * If a file is provided, upload the file
         * and set the avatar_src field to the file path.
         * If a file is not provided, use the current avatar_src.
         */
        if (file) body.avatar_src = await storageService.uploadFile(file, pk);
        else body.avatar_src = current.avatar_src;

        /**
         * If the password is not provided, use the current password.
         */
        if (!body.password) body.password = current.password;

        /**
         * Update the user.
         */
        await model
            .update({ body })
            .where(model.pk, pk)
            .transaction(transaction)
            .execute();
    }

    async destroy(options={ pk: null, user: null }, transaction) {
        const { pk, user } = options;

        /**
         * Ensure that the required fields are present
         * and that the user exists.
         */
        await model
            .throwIfNotPresent(pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(user, 'User is required')
            .find()
            .where(model.pk, pk)
            .throwIfNotFound()
            .executeOne();

        /**
         * A user can only delete their own profile.
         */
        if (user.sub !== pk)
            throw new ControllerError(403, 'Forbidden');


        /**
         * Delete the user.
         */
        await model.optionsBuilder()
            .destroy()
            .where(model.pk, pk)
            .transaction(transaction)
            .execute();
    }

    /**
     * @function login
     * @description Login a user.
     * @param {Object} options
     * @param {String} options.email
     * @param {String} options.password
     * @returns {Promise<Object>}
     */
    async login(options={ email: null, password: null }) {
        const { email, password } = options;
        
        /**
         * Ensure that the required fields are present
         * and get the user that is trying to login.
         */
        const user = await model
            .throwIfNotPresent(email, 'Email is required')
            .throwIfNotPresent(password, 'Password is required')
            .find()
            .where('email', email)                        
            .throwIfNotFound()
            .dto(userFullDto)
            .executeOne();
        
        /**
         * Ensure that the password matches the user's password.
         */
        await model.throwIfNoPasswordMatch(password, user.password);
        delete user.password;
        
        /**
         * Return the user and a JWT token to authenticate the user.
         */
        return { user, token: JwtService.sign(user.uuid) };
    }
}

const service = new UserService();

export default service;
