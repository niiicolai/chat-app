import Validator from '../../shared/validators/user_status_service_validator.js';
import err from '../../shared/errors/index.js';
import dto from '../dto/user_status_dto.js';
import User from '../mongoose/models/user.js';

/**
 * @class UserStatusService
 * @description Service class for user statuses.
 * @exports UserStatusService
 */
class UserStatusService {

    /**
     * @function findOne
     * @description Find a user status by user_uuid
     * @param {Object} options
     * @param {String} options.user_uuid
     * @returns {Promise<Object>}
     */
    async findOne(options = { user_uuid: null }) {
        Validator.findOne(options);

        const { user_uuid: _id } = options;
        const user = await User.findOne({ _id });
        const userStatus = user?.user_status;
        
        if (!userStatus) throw new err.EntityNotFoundError('user_status');

        return dto({ ...userStatus._doc, user: user._doc });
    }

    /**
     * @function update
     * @description Update a user status by user_uuid
     * @param {Object} options
     * @param {Object} options.body
     * @param {String} options.body.message
     * @param {String} options.body.user_status_state
     * @param {String} options.user_uuid
     * @returns {Promise<Object>}
     */
    async update(options={ body: null, user_uuid: null }) {
        Validator.update(options);

        const { body, user_uuid: _id } = options;
        const { message, user_status_state } = body;

        const user = await User.findOne({ _id });
        const userStatus = user?.user_status;

        if (!user) throw new err.EntityNotFoundError('user');
        if (!userStatus) throw new err.EntityNotFoundError('user_status');

        if (message) userStatus.message = message;
        if (user_status_state) userStatus.user_status_state = user_status_state;

        await user.save();

        return dto({ ...userStatus._doc, user: user._doc });
    }
}

const service = new UserStatusService();

export default service;
