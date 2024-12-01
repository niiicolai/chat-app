import ControllerError from '../../shared/errors/controller_error.js';
import EntityNotFoundError from '../../shared/errors/entity_not_found_error.js';
import dto from '../dto/user_status_dto.js';
import User from '../mongoose/models/user.js';
import UserStatusState from '../mongoose/models/user_status_state.js';
import UserStatusServiceValidator from '../../shared/validators/user_status_service_validator.js';

class Service {

    /**
     * @function findOne
     * @description Find a user status by user_uuid
     * @param {Object} options
     * @param {String} options.user_uuid
     * @returns {Object}
     */
    async findOne(options = { user_uuid: null }) {
        UserStatusServiceValidator.findOne(options);

        const user = await User.findOne({ _id: options.user_uuid });
        const userStatus = user?.user_status;

        if (!userStatus) throw new EntityNotFoundError('user_status');

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
     * @returns {Object}
     */
    async update(options={ body: null, user_uuid: null }) {
        UserStatusServiceValidator.update(options);

        const user = await User.findOne({ _id: options.user_uuid });
        const userStatus = user?.user_status;

        if (!user) throw new ControllerError(404, 'User not found');
        if (!userStatus) throw new ControllerError(404, 'User status not found');

        const { message, user_status_state } = options.body;

        if (message) userStatus.message = message;
        if (user_status_state) userStatus.user_status_state = user_status_state;

        await user.save();

        return dto({ ...userStatus._doc, user });
    }
}

const service = new Service();

export default service;
