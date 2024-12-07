import ControllerError from "../errors/controller_error.js";
import paginationValidator from './pagination_validator.js';

export default class RoomFileServiceValidator {
    static findOne(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');
    }

    static findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.room_uuid) throw new ControllerError(400, 'No room_uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');

        return paginationValidator(options);
    }

    static create(options = { file: null, body: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.file || options.file && options.file.size <= 0) throw new ControllerError(400, 'No file provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.body.room_uuid) throw new ControllerError(400, 'No room_uuid provided');
        if (!options.body.room_file_type_name) throw new ControllerError(400, 'No room_file_type_name provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');
    }

    static destroy(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');
    }

    static isOwner(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'isOwner: No options provided');
        if (!options.uuid) throw new ControllerError(500, 'isOwner: No uuid provided');
        if (!options.user) throw new ControllerError(500, 'isOwner: No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'isOwner: No user.sub provided');
    }
}
