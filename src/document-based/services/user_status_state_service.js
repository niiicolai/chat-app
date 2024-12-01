import TypeServiceValidator from '../../shared/validators/type_service_validator.js';
import EntityNotFoundError from '../../shared/errors/entity_not_found_error.js';
import UserStatusState from '../mongoose/models/user_status_state.js';
import dto from '../dto/type_dto.js';

class Service {
    async findOne(options = { name: null }) {
        TypeServiceValidator.findOne(options);

        const result = await UserStatusState.findOne({ _id: options.name });
        if (!result) throw new EntityNotFoundError('user_status_state');

        return dto(result._doc);
    }

    async findAll(options = { page: null, limit: null }) {
        options = TypeServiceValidator.findAll(options);

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

const service = new Service();

export default service;
