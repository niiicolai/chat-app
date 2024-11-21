import ControllerError from "../errors/controller_error.js";
import paginationValidator from './pagination_validator.js';

export default class TypeServiceValidator {
    static findOne(options = { name: null }) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new ControllerError(500, 'Invalid options provided');
        }
        if (!options.name) throw new ControllerError(400, 'name is required');    
    }

    static findAll(options = { page: null, limit: null }) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new ControllerError(500, 'Invalid options provided');
        }
        return paginationValidator(options);
    }
};
