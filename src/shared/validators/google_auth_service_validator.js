import ControllerError from "../errors/controller_error.js";

export default class GoogleAuthServiceValidator {
    static create(options = { info: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.info) throw new ControllerError(500, 'The response from Google is empty');
        if (!options.info.data) throw new ControllerError(500, 'No data in the response from Google');
        if (!options.info.data.email) throw new ControllerError(500, 'No email in the response from Google');
        if (!options.info.data.id) throw new ControllerError(500, 'No id in the response from Google');
    }

    static login(options = { info: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.info) throw new ControllerError(500, 'The response from Google is empty');
        if (!options.info.data) throw new ControllerError(500, 'No data in the response from Google');
        if (!options.info.data.id) throw new ControllerError(500, 'No id in the response from Google');
    }

    static addToExistingUser(options={ third_party_id: null, type: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.third_party_id) throw new ControllerError(400, 'No third_party_id provided');
        if (!options.type) throw new ControllerError(400, 'No type provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
    }
};
