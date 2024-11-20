import ControllerError from '../../shared/errors/controller_error.js';
import dto from '../dto/user_status_dto.js';
import neodeInstance from '../neode/index.js';

class Service {

    async findOne(options = { user_uuid: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.user_uuid) throw new ControllerError(400, 'No user_uuid provided');

        const { user_uuid } = options;

        const user = await neodeInstance.model('User').find(user_uuid);
        const userStatus = user ? user.get('user_status').endNode() : null;
        const userStatusState = userStatus ? userStatus.get('user_status_state').endNode() : null;

        if (!userStatus) throw new ControllerError(404, 'User status not found');

        return dto(userStatus.properties(), [
                { user_status_state: userStatusState.properties() },
                { user: { uuid: user_uuid} }
            ]
        );
    }

    async update(options={ body: null, user_uuid: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.user_uuid) throw new ControllerError(500, 'No user_uuid provided');

        const { body, user_uuid } = options;
        const { message, user_status_state } = body;

        const user = await neodeInstance.model('User').find(user_uuid);
        if (!user) throw new ControllerError(404, 'User not found');

        const userStatus = user.get('user_status').endNode().properties();
        if (!userStatus) throw new ControllerError(500, 'User status not found');

        const userStatusInstance = await neodeInstance.model('UserStatus').find(userStatus.uuid);
        if (!userStatusInstance) throw new ControllerError(500, 'User status not found');

        if (user_status_state) {
            const oldState = userStatusInstance.get('user_status_state').endNode();
            if (oldState) await userStatusInstance.detachFrom(oldState);

            const newState = await neodeInstance.model('UserStatusState').find(user_status_state); 
            if (!newState) throw new ControllerError(404, 'User status state not found');
            
            await userStatusInstance.relateTo(newState, 'user_status_state');
        }

        if (message) await userStatusInstance.update({ message });

        return this.findOne({ user_uuid });
    }
}

const service = new Service();

export default service;
