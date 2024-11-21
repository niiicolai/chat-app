import ControllerError from "../errors/controller_error.js";
import paginationValidator from './pagination_validator.js';

const total_files_bytes_allowed = parseInt(process.env.ROOM_TOTAL_UPLOAD_SIZE || 52428800);
const single_file_bytes_allowed = parseInt(process.env.ROOM_UPLOAD_SIZE || 5242880);

export default class RoomServiceValidator {
    static findOne(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');
    }

    static findAll(options = { user: null, page: null, limit: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');

        return paginationValidator(options);
    }

    static create(options = { body: null, file: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');
        if (!options.body.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.body.name) throw new ControllerError(400, 'No name provided');
        if (!options.body.description) throw new ControllerError(400, 'No description provided');
        if (!options.body.room_category_name) throw new ControllerError(400, 'No room_category_name provided');

        // This must use default values because the permission service expects a room to be created
        const { file } = options;
        if (file && file.size > 0) {
            if (file.size > total_files_bytes_allowed) {
                throw new ControllerError(400, 'File exceeds total file size limit');
            }
            if (file.size > single_file_bytes_allowed) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }
        }
    }

    static update(options = { uuid: null, body: null, file: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');        
    }

    static destroy(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');        
    }

    static editSettings(options = { uuid: null, body: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.body) throw new ControllerError(400, 'No body provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');        
    }

    static leave(options = { uuid: null, user: null }) {
        if (!options) throw new ControllerError(500, 'No options provided');
        if (!options.uuid) throw new ControllerError(400, 'No uuid provided');
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');        
    }
};
