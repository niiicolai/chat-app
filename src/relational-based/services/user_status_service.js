import Validator from '../../shared/validators/user_status_service_validator.js';
import err from '../../shared/errors/index.js';
import db from '../sequelize/models/index.cjs';
import dto from '../dto/user_status_dto.js';

/**
 * @class UserStatusService
 * @description Service class for user statuses.
 * @exports UserStatusService
 */
class UserStatusService {

    /**
     * @function findOne
     * @description Find a user status by user UUID.
     * @param {Object} options
     * @param {string} options.user_uuid
     * @returns {Promise<Object>}
     */
    async findOne(options = { user_uuid: null }) {
        Validator.findOne(options);

        const { user_uuid } = options;
        const entity = await db.UserStatusView.findOne({ where: { user_uuid } });
        
        if (!entity) throw new err.EntityNotFoundError('user_status');

        return dto(entity);
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
    async update(options={ body: null, user_uuid: null }) {
        Validator.update(options);

        const { body, user_uuid } = options;
        const { user_status_state, message } = body;

        if (user_status_state || message) {
            await db.sequelize.transaction(async (transaction) => {
                const userStatus = await db.UserStatusView.findOne({ 
                    where: { user_uuid }, 
                    transaction 
                });
                if (!userStatus) throw new err.EntityNotFoundError('user_status');

                await userStatus.updateUserStatusProc({ 
                    ...(user_status_state && { user_status_state }),
                    ...(message && { message }),
                }, transaction);
            });
        }

        return await db.UserStatusView
            .findOne({ where: { user_uuid } })
            .then(entity => dto(entity));
    }
}

const service = new UserStatusService();

export default service;
