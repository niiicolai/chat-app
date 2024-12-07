import ControllerError from "./controller_error.js";

/**
 * @class InvalidCredentialsError
 * @classdesc Throw a HTTP 401 error about the user not being able to log in.
 * @extends ControllerError
 */
export default class InvalidCredentialsError extends ControllerError {
    constructor(entityName) {
        super(401, `Invalid email or password`);
    }
}
