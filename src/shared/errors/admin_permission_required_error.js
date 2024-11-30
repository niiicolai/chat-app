import ControllerError from "./controller_error.js";

/**
 * @class AdminPermissionRequiredError
 * @classdesc Throw a HTTP 403 error about the user not being an admin of the room.
 * @extends ControllerError
 */
export default class AdminPermissionRequiredError extends ControllerError {
    constructor() {
        super(403, 'User is not an admin of the room');
    }
}
