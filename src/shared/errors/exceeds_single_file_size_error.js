import ControllerError from "./controller_error.js";

/**
 * @class ExceedsSingleFileSizeError
 * @classdesc Throw a HTTP 413 error about a file exceeding the single file size limit.
 * @extends ControllerError
 */
export default class ExceedsSingleFileSizeError extends ControllerError {
    constructor() {
        super(413, 'File exceeds single file size limit');
    }
}
