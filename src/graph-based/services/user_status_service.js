import Validator from '../../shared/validators/user_status_service_validator.js';
import err from '../../shared/errors/index.js';
import dto from '../dto/user_status_dto.js';
import neodeInstance from '../neode/index.js';

/**
 * @class UserStatusService
 * @description Service class for user statuses.
 * @exports UserStatusService
 */
class UserStatusService {

    /**
     * @function findOne
     * @description Find a user status by user uuid.
     * @param {Object} options
     * @param {string} options.user_uuid
     * @returns {Promise<Object>}
     */
    async findOne(options = { user_uuid: null }) {
        Validator.findOne(options);

        const { user_uuid } = options;

        const user = await neodeInstance.model('User').find(user_uuid);
        const userStatus = user ? user.get('user_status').endNode() : null;
        const userStatusState = userStatus ? userStatus.get('user_status_state').endNode() : null;

        if (!userStatus) throw new err.EntityNotFoundError('user_status');

        return dto({
            ...userStatus.properties(), 
            user_status_state: userStatusState.properties(),
            user: user.properties(),
        });
    }

    /**
     * @function update
     * @description Update a user status.
     * @param {Object} options
     * @param {Object} options.body
     * @param {string} options.body.message optional
     * @param {string} options.body.user_status_state optional
     * @param {string} options.user_uuid
     * @returns {Promise<Object>}
     */
    async update(options = { body: null, user_uuid: null }) {
        Validator.update(options);

        const { body, user_uuid } = options;
        const { message, user_status_state } = body;

        const user = await neodeInstance.model('User').find(user_uuid);
        if (!user) throw new err.EntityNotFoundError('user');

        const session = neodeInstance.session();
        await session.writeTransaction(async tx => {
            await tx.run(
                'MATCH (u:User {uuid: $user_uuid}) ' +
                'MATCH (u)-[:STATUS_IS]->(us:UserStatus) ' +
                'MATCH (uss:UserStatusState {name: $user_status_state}) ' +
                'CREATE (us)-[:STATE_IS]->(uss)',
                { user_uuid, user_status_state }
            );

            await tx.run(
                'MATCH (u:User {uuid: $user_uuid}) ' +
                'MATCH (u)-[:STATUS_IS]->(us:UserStatus) ' +
                'SET us.message = $message',
                { user_uuid, message }
            );
        }).finally(() => session.close());
        
        return this.findOne({ user_uuid });
    }
}

const service = new UserStatusService();

export default service;
