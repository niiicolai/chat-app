import UserStatusServiceValidator from '../../shared/validators/user_status_service_validator.js';
import EntityNotFoundError from '../../shared/errors/entity_not_found_error.js';
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
        UserStatusServiceValidator.findOne(options);

        const { user_uuid } = options;

        const entity = await db.UserStatusView.findOne({ where: { user_uuid } });
        if (!entity) throw new EntityNotFoundError('user_status');

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
        UserStatusServiceValidator.update(options);

        const { body, user_uuid } = options;
        const { message, user_status_state } = body;

        await db.sequelize.transaction(async (transaction) => {
            const userStatus = await db.UserStatus.findOne({ where: { user_uuid }, transaction });
            if (!userStatus) throw new EntityNotFoundError('user_status');

            const replacements = {
                user_uuid,
                user_status_state: user_status_state || userStatus.user_status_state,
                message: message || userStatus.message,
                last_seen_at: userStatus.last_seen_at,
                user_status_total_online_hours: userStatus.user_status_total_online_hours,
            };

            await db.sequelize.query('CALL update_user_status_proc(:user_uuid, :user_status_state, :message, :last_seen_at, :user_status_total_online_hours, @result)', {
                replacements,
                transaction
            });
        });

        return await db.UserStatusView.findOne({ where: { user_uuid } })
            .then(entity => dto(entity));
    }
}

const service = new UserStatusService();

export default service;
