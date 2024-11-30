import ControllerError from "./controller_error.js";

/**
 * @class ExceedsRoomChannelCountError
 * @classdesc Throw a HTTP 413 error about the room having too many channels.
 * @extends ControllerError
 */
export default class ExceedsRoomChannelCountError extends ControllerError {
    constructor() {
        super(400, 'Room channel count exceeds limit. The room cannot have more channels');
    }
}
