import ControllerError from "./controller_error.js";

/**
 * @class EntityNotFoundError
 * @classdesc Throw a HTTP 404 error about the entity not being found.
 * @extends ControllerError
 */
export default class EntityNotFoundError extends ControllerError {
    constructor(entityName) {
        super(404, `${entityName} not found`);
    }
}
