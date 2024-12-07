import ControllerError from "./controller_error.js";

/**
 * @class UserEmailAlreadyVerifiedError
 * @classdesc Throw a HTTP 400 error about the user email already being verified.
 * @extends ControllerError
 */
export default class UserEmailAlreadyVerifiedError extends ControllerError {
    constructor() {
        super(400, `User email already verified`);
    }
}
