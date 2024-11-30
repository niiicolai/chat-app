import ControllerError from "./controller_error.js";

/**
 * @class OwnershipOrLeastModRequiredError
 * @classdesc Throw a HTTP 403 error about the user not being an owner of the message, or an admin or moderator of the room.
 * @extends ControllerError
 */
export default class OwnershipOrLeastModRequiredError extends ControllerError {
    constructor(entityName) {
        super(403, `User is not an owner of the ${entityName}, or an admin or moderator of the room`);
    }
}
