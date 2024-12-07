import ControllerError from "./controller_error.js";

/**
 * @class DuplicateThirdPartyLoginError
 * @classdesc Throw a HTTP 409 error about the user already having a third party login linked. 
 * @extends ControllerError
 */
export default class DuplicateThirdPartyLoginError extends ControllerError {
    constructor(loginType) {
        super(409, `User already has a ${loginType} account linked`);
    }
}
