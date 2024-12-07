import ControllerError from "./controller_error.js";

/**
 * @class DuplicateRoomUserError
 * @classdesc Throw a HTTP 409 error about the user already being in the room.
 * @extends ControllerError
 */
export default class DuplicateRoomUserError extends ControllerError {
    constructor() {
        super(409, `User already in room`);
    }
}
