import ControllerError from "../errors/controller_error.js";

export default class UserPasswordResetServiceValidator {
    static create(options = { body: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.body.email) throw new ControllerError(400, 'No email provided');
    }

    static resetPassword(options = { uuid: null, body: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.body.password) throw new ControllerError(400, 'No password provided');
    }
};
