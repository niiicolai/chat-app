import ControllerError from "./controller_error.js";

/**
 * @class DuplicateEntryError
 * @classdesc Throw a HTTP 409 error about the entry already existing.
 * @extends ControllerError
 */
export default class DuplicateEntryError extends ControllerError {
    constructor(entityName, entryName, entryValue) {
        super(409, `${entityName} with ${entryName} ${entryValue} already exists`);
    }
}
