import ControllerError from "./controller_error.js";

/**
 * @class RoomLeastOneAdminRequiredError
 * @classdesc Throw a HTTP 403 error about a room requiring at least one admin and the user being the only one.
 * @extends ControllerError
 */
export default class RoomLeastOneAdminRequiredError extends ControllerError {
    constructor() {
        super(403, `A room must have at least one admin and you are the only one`);
    }
}
