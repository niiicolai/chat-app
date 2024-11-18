import ControllerError from "../errors/controller_error.js";

export default class UserEmailVerificationServiceValidator {
    static resend(options = { user_uuid: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.user_uuid) throw new ControllerError(400, 'No user_uuid provided');
    }

    static confirm(options = { uuid: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
    }
};
