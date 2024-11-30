import ControllerError from "./controller_error.js";

/**
 * @class ExceedsRoomUserCountError
 * @classdesc Throw a HTTP 400 error about the room having too many users.
 * @extends ControllerError
 */
export default class ExceedsRoomUserCountError extends ControllerError {
    constructor() {
        super(400, 'Room user count exceeds limit. The room cannot have more users');
    }
}
