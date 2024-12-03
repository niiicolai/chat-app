import Validator from '../../shared/validators/type_service_validator.js';
import err from '../../shared/errors/index.js';
import RoomUserRole from '../mongoose/models/room_user_role.js';
import dto from '../dto/type_dto.js';

/**
 * @class RoomUserRoleService
 * @description Service class for room user roles.
 * @exports RoomUserRoleService
 */
class RoomUserRoleService {

    /**
     * @function findOne
     * @description Find a room user role by name
     * @param {Object} options
     * @param {String} options.name
     * @returns {Promise<Object>}
     */
    async findOne(options = { name: null }) {
        Validator.findOne(options);

        const result = await RoomUserRole.findOne({ _id: options.name });
        if (!result) throw new err.EntityNotFoundError('room_user_role');

        return dto(result._doc);
    }

    /**
     * @function findAll
     * @description Find all room user roles
     * @param {Object} options
     * @param {Number} options.page optional
     * @param {Number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { page: null, limit: null }) {
        options = Validator.findAll(options);

        const { page, limit, offset } = options;
        const [total, data] = await Promise.all([
            RoomUserRole.find().countDocuments(),
            RoomUserRole.find()
                .sort({ created_at: -1 })
                .limit(limit || 0)
                .skip((page && limit) ? offset : 0)
                .then((types) => types.map((type) => dto(type._doc))),
        ]);

        return {
            total, data,
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }
}

const service = new RoomUserRoleService();

export default service;
