import ControllerError from '../../shared/errors/controller_error.js';
import dto from '../dto/user_status_dto.js';
import User from '../mongoose/models/user.js';
import UserStatusState from '../mongoose/models/user_status_state.js';

class Service {

    async findOne(options = { user_uuid: null }) {
        const { user_uuid } = options;

        if (!user_uuid) {
            throw new ControllerError(400, 'No user_uuid provided');
        }

        const user = await User.findOne({ uuid: user_uuid }).populate('user_status');
        if (!user) {
            throw new ControllerError(404, 'User not found');
        }

        if (!user.user_status) {
            throw new ControllerError(500, 'User status not found');
        }

        return dto(user.user_status);
    }

    async update(options={ body: null, user_uuid: null }) {
        const { body, user_uuid } = options;
        const { message, user_status_state } = body;

        if (!user_uuid) throw new ControllerError(500, 'No user_uuid provided');

        const user = await User.findOne({ uuid: user_uuid }).populate('user_status');
        if (!user) {
            throw new ControllerError(404, 'User not found');
        }

        if (!user.user_status) {
            throw new ControllerError(500, 'User status not found');
        }

        if (message) user.user_status.message = message;
        
        if (user_status_state) {
            const state = await UserStatusState.findOne({ name: user_status_state });
            if (!state) {
                throw new ControllerError(404, 'User status state not found');
            }

            user.user_status.user_status_state = state;
        }

        return dto((await user.user_status.save()));
    }
}

const service = new Service();

export default service;
