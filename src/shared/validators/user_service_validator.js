import ControllerError from "../errors/controller_error.js";

export default class UserServiceValidator {
    static findOne(options = { uuid: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
    }

    static create(options = { body: null, file: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.body.uuid) throw new ControllerError(400, 'No UUID provided');
        if (!options.body.username) throw new ControllerError(400, 'No username provided');
        if (!options.body.email) throw new ControllerError(400, 'No email provided');
        if (!options.body.password) throw new ControllerError(400, 'No password provided');
    }

    static update(options = { body: null, file: null, uuid: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.uuid) throw new ControllerError(500, 'No UUID provided');
    }

    static login(options = { body: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.body.email) throw new ControllerError(400, 'No email provided');
        if (!options.body.password) throw new ControllerError(400, 'No password provided');
    }

    static destroy(options = { uuid: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No UUID provided');
    }

    static destroyAvatar(options = { uuid: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No UUID provided');
    }

    static destroyUserLogins(options = { uuid: null, login_uuid: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No UUID provided');
        if (!options.login_uuid) throw new ControllerError(400, 'No login UUID provided');
    }

    static getUserLogins(options = { uuid: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No UUID provided');
    }

    static createUserLogin(options = { uuid: null, body: null }) {
        if (!options || typeof options != 'object') throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No UUID provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.body.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.body.user_login_type_name) throw new ControllerError(400, 'No user login type provided');
        if (options.body.user_login_type_name === 'Password' && !options.body.password) {
            throw new ControllerError(400, 'No password provided');
        } else if (options.body.user_login_type_name !== 'Password' && !options.body.third_party_id) {
            throw new ControllerError(400, 'No third_party_id provided');
        }
    }

    static getUserEmailVerification(options = { uuid: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No UUID provided');
    }
};
