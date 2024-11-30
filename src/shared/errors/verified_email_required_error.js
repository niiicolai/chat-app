import ControllerError from "./controller_error.js";

/**
 * @class VerifiedEmailRequiredError
 * @classdesc Throw a HTTP 403 error about the user not being in the room.
 * @extends ControllerError
 */
export default class VerifiedEmailRequiredError extends ControllerError {

    /**
     * @constructs VerifiedEmailRequiredError
     * @param {string} toAction
     * @example new VerifiedEmailRequiredError('create a room')
     * => 'You must verify your email before you can create a room'
     */
    constructor(toAction) {
        super(403, `You must verify your email before you can ${toAction}`);
    }
}
