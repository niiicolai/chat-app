import Validator from '../../shared/validators/type_service_validator.js';
import err from '../../shared/errors/index.js';
import UserStatusState from '../mongoose/models/user_status_state.js';
import dto from '../dto/type_dto.js';

/**
 * @class UserStatusStateService
 * @description Service class for user status states.
 * @exports UserStatusStateService
 */
class UserStatusStateService {

    /**
     * @function findOne
     * @description Find a user status state by name.
     * @param {Object} options
     * @param {String} options.name
     * @returns {Promise<Object>}
     */
    async findOne(options = { name: null }) {
        Validator.findOne(options);

        const { name: _id } = options;
        const result = await UserStatusState.findOne({ _id });
        if (!result) throw new err.EntityNotFoundError('user_status_state');

        return dto(result._doc);
    }

    /**
     * @function findAll
     * @description Find all user status states.
     * @param {Object} options
     * @param {number} options.page optional
     * @param {number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { page: null, limit: null }) {
        options = Validator.findAll(options);

        const { page, limit, offset } = options;
        const [total, data] = await Promise.all([
            UserStatusState.find().countDocuments(),
            UserStatusState.find()
                .sort({ created_at: -1 })
                .limit(limit || 0)
                .skip((page && limit) ? offset : 0)
                .then((states) => states.map((state) => dto(state._doc))),
        ]);

        return {
            total, data,
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }
}

const service = new UserStatusStateService();

export default service;
