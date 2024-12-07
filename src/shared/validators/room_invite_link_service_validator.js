import ControllerError from "../errors/controller_error.js";
import paginationValidator from './pagination_validator.js';

export default class RoomInviteLinkServiceValidator {
    static findOne(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');
    }

    static findAll(options = { room_uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.room_uuid) throw new ControllerError(400, 'No room_uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');

        return paginationValidator(options);
    }

    static create(options = { body: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');
        if (!options.body.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.body.room_uuid) throw new ControllerError(400, 'No room_uuid provided');
        if (options.body.expires_at && isNaN(new Date(options.body.expires_at))) {
            throw new ControllerError(400, 'Invalid time value');
        }
        if (options.body.expires_at && new Date(options.body.expires_at) < new Date()) {
            throw new ControllerError(400, 'The expiration date cannot be in the past');
        }
    }

    static update(options = { uuid: null, body: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (options.body.expires_at && new Date(options.body.expires_at) < new Date()) {
            throw new ControllerError(400, 'The expiration date cannot be in the past');
        }       
    }

    static destroy(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');
    }

    static join(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');
    }
};
