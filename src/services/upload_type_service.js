import model from '../models/upload_type.js';
import dto from '../dtos/upload_type.js';
import ControllerError from '../errors/controller_error.js';

class UploadTypeService {
    constructor() {
        // For the controller
        this.model = model;
        this.dto = dto;
    }

    template() {
        return this.model.template();
    }

    async findOne(findArgs = { pk: null }) {
        if (!findArgs.pk)
            throw new ControllerError(400, 'Primary key is required');

        const { pk } = findArgs;
        const type = await model.findOne(model
            .optionsBuilder()
            .findOne(pk)
            .build());

        if (!type)
            throw new ControllerError(404, 'Upload type not found');

        return dto(type);
    }

    async findAll(findAllArgs = { page: 1, limit: 10 }) {

        const { page, limit, user } = findAllArgs;
        const options = model
            .optionsBuilder()
            .findAll(page, limit)
            .build()

        const total = await model.count(options);
        const types = await model.findAll(options);
        const pages = Math.ceil(total / limit);
        const data = types.map(type => dto(type));

        return {
            data,
            meta: {
                total,
                page,
                pages
            }
        };
    }
}

// Create a new service
const service = new UploadTypeService();

// Export the service
export default service;
