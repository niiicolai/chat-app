import ControllerError from "../errors/controller_error.js";

export default class UserStatusServiceValidator {
    static findOne(options = { user_uuid: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.user_uuid) throw new ControllerError(500, 'No user_uuid provided');
    }

    static update(options = { body: null, user_uuid: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.user_uuid) throw new ControllerError(500, 'No user_uuid provided');
    }
};
