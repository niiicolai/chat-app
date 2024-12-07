import Validator from '../../shared/validators/type_service_validator.js';
import err from '../../shared/errors/index.js';
import RoomCategory from '../mongoose/models/room_category.js';
import dto from '../dto/type_dto.js';

/**
 * @class RoomCategoryService
 * @description Service class for room categories.
 * @exports RoomCategoryService
 */
class RoomCategoryService {

    /**
     * @function findOne
     * @description Find a room category by name
     * @param {Object} options
     * @param {String} options.name
     * @returns {Promise<Object>}
     */
    async findOne(options = { name: null }) {
        Validator.findOne(options);

        const result = await RoomCategory.findOne({ _id: options.name });
        if (!result) throw new err.EntityNotFoundError('room_category');

        return dto(result._doc);
    }

    /**
     * @function findAll
     * @description Find all room categories
     * @param {Object} options
     * @param {Number} options.page optional
     * @param {Number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { page: null, limit: null }) {
        options = Validator.findAll(options);

        const { page, limit, offset } = options;
        const [total, data] = await Promise.all([
            RoomCategory.find().countDocuments(),
            RoomCategory.find()
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

const service = new RoomCategoryService();

export default service;
