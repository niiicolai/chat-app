import ControllerError from "./controller_error.js";

/**
 * @class EntityExpiredError
 * @classdesc Throw a HTTP 410 error about the entity being expired.
 * @extends EntityExpiredError
 */
export default class EntityExpiredError extends ControllerError {
    constructor(entityName) {
        super(410, `${entityName} has expired`);
    }
}
