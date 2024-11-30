import ControllerError from "./controller_error.js";

/**
 * @class ExceedsRoomTotalFilesLimitError
 * @classdesc Throw a HTTP 413 error about the room not having enough space for a file.
 * @extends ControllerError
 */
export default class ExceedsRoomTotalFilesLimitError extends ControllerError {
    constructor() {
        super(413, 'The room does not have enough space for this file');
    }
}
