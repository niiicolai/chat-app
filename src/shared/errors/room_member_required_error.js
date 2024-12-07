import ControllerError from "./controller_error.js";

/**
 * @class RoomMemberRequiredError
 * @classdesc Throw a HTTP 403 error about the user not being in the room.
 * @extends ControllerError
 */
export default class RoomMemberRequiredError extends ControllerError {
    constructor() {
        super(403, 'User is not in the room');
    }
}
