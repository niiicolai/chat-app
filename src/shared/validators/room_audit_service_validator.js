import ControllerError from "../errors/controller_error.js";
import paginationValidator from './pagination_validator.js';

export default class RoomAuditServiceValidator {
    static findOne(options = { uuid: null, user: null }) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new ControllerError(500, 'Invalid options provided');
        }
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');
    }

    static findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new ControllerError(500, 'Invalid options provided');
        }
        if (!options.room_uuid) throw new ControllerError(400, 'No room_uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');

        return paginationValidator(options);
    }
};
