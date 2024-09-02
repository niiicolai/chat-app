import ControllerError from '../errors/controller_error.js';
import BaseCrudService from './base_crud_service.js';
import JwtService from './jwt_service.js';
import model from '../models/user.js';
import dto from '../dtos/user.js';

/**
 * @class UserService
 * @extends BaseCrudService
 */
class UserService extends BaseCrudService {
    constructor() {
        super({ model, dto });
    }

    /**
     * @function create
     * @description Create a new user
     * @param {Object} data The user data
     * @returns {Object} The user and token
     */
    async create(data) {
        const user = await super.create(data);
        const token = JwtService.sign(user.uuid);
        return { user: this.dto(user), token };
    }

    /**
     * @function login
     * @description Login a user
     * @param {Object} data The login data
     * @returns {Object} The user and token
     */
    async login(data) {
        const user = await this.model.findOne({ where: { email: data.email } });
        if (!user) throw new ControllerError('User not found', 404);
        const isValid = await this.model.comparePassword(user, data.password);
        if (!isValid) throw new ControllerError('Invalid password', 400);

        const token = JwtService.sign(user.uuid);
        return { user: this.dto(user), token };
    }
}

// Create a new service
const service = new UserService();

// Export the service
export default service;
