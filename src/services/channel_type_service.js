import model from '../models/channel_type.js';
import dto from '../dtos/channel_type.js';
import ControllerError from '../errors/controller_error.js';

class ChannelTypeService {
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
            throw new ControllerError(404, 'Channel type not found');

        return dto(type);
    }

    async findAll(findAllArgs = {}) {

        const { page, limit } = findAllArgs;
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
const service = new ChannelTypeService();

// Export the service
export default service;
