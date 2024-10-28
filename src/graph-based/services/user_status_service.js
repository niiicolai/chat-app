import ControllerError from '../../shared/errors/controller_error.js';
import dto from '../dto/user_status_dto.js';
import neodeInstance from '../neode/index.js';

class Service {

    async findOne(options = { user_uuid: null }) {
        const { user_uuid } = options;

        if (!user_uuid) {
            throw new ControllerError(400, 'No user_uuid provided');
        }

        const user = await neodeInstance.model('User').find(user_uuid);
        if (!user) {
            throw new ControllerError(404, 'User not found');
        }

        const userStatusInstance = user.get('user_status').endNode();
        if (!userStatusInstance) {
            throw new ControllerError(500, 'User status not found');
        }

        const userStatus = userStatusInstance.properties();
        const user_status_state = userStatusInstance.get('user_status_state').endNode().properties();

        return dto(userStatus, [{ user_status_state }]);
    }

    async update(options={ body: null, user_uuid: null }) {
        const { body, user_uuid } = options;
        const { message, user_status_state } = body;

        if (!user_uuid) throw new ControllerError(500, 'No user_uuid provided');

        const user = await neodeInstance.model('User').find(user_uuid);
        if (!user) {
            throw new ControllerError(404, 'User not found');
        }

        const userStatus = user.get('user_status').endNode().properties();
        if (!userStatus) {
            throw new ControllerError(500, 'User status not found');
        }

        const userStatusInstance = await neodeInstance.model('UserStatus').find(userStatus.uuid);

        if (user_status_state) {
            const oldState = userStatusInstance.get('user_status_state').endNode();
            if (oldState) {
                await userStatusInstance.detachFrom(oldState);
            }

            const state = await neodeInstance.model('UserStatusState').find(user_status_state); 
            if (!state) {
                throw new ControllerError(404, 'User status state not found');
            }
            
            await userStatusInstance.relateTo(state, 'user_status_state');
        }

        if (message) {
            await userStatusInstance.update({ message });
        }

        return this.findOne({ user_uuid });
    }
}

const service = new Service();

export default service;
