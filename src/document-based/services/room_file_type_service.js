import Validator from '../../shared/validators/type_service_validator.js';
import err from '../../shared/errors/index.js';
import RoomFileType from '../mongoose/models/room_file_type.js';
import dto from '../dto/type_dto.js';

/**
 * @class RoomFileTypeService
 * @description Service class for room file types.
 * @exports RoomFileTypeService
 */
class RoomFileTypeService {

    /**
     * @function findOne
     * @description Find a room file type by name
     * @param {Object} options
     * @param {String} options.name
     * @returns {Promise<Object>}
     */
    async findOne(options = { name: null }) {
        Validator.findOne(options);

        const result = await RoomFileType.findOne({ _id: options.name });
        if (!result) throw new err.EntityNotFoundError('room_file_type');

        return dto(result._doc);
    }

    /**
     * @function findAll
     * @description Find all room file types
     * @param {Object} options
     * @param {Number} options.page optional
     * @param {Number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { page: null, limit: null }) {
        options = Validator.findAll(options);

        const { page, limit, offset } = options;
        const [total, data] = await Promise.all([
            RoomFileType.find().countDocuments(),
            RoomFileType.find()
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

const service = new RoomFileTypeService();

export default service;
