import ControllerError from "../errors/controller_error.js";

export default class RoomPermissionServiceValidator {

    static isVerified(options = { user: null }) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new ControllerError(500, 'Invalid options provided');
        }
        if (!options.user) throw new ControllerError(500, 'No user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No user.sub provided');
    }

    static isInRoom(options = { room_uuid: null, user: null, role_name: null }) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new ControllerError(500, 'Invalid options provided');
        }
        if (!options.room_uuid) throw new ControllerError(500, 'No options.room_uuid provided');
        if (!options.user) throw new ControllerError(500, 'No options.user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No options.user.sub provided');
    }

    static isInRoomByChannel(options = { channel_uuid: null, user: null, role_name: null }) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new ControllerError(500, 'Invalid options provided');
        }
        if (!options.channel_uuid) throw new ControllerError(500, 'No options.channel_uuid provided');
        if (!options.user) throw new ControllerError(500, 'No options.user provided');
        if (!options.user.sub) throw new ControllerError(500, 'No options.user.sub provided');
    }

    static fileExceedsTotalFilesLimit(options = { room_uuid: null, bytes: null }) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new ControllerError(500, 'Invalid options provided');
        }
        if (!options.room_uuid) throw new ControllerError(500, 'No options.room_uuid provided');
        if (!options.bytes) throw new ControllerError(500, 'No options.bytes provided');
    }

    static fileExceedsSingleFileSize(options = { room_uuid: null, bytes: null }) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new ControllerError(500, 'Invalid options provided');
        }
        if (!options.room_uuid) throw new ControllerError(500, 'No options.room_uuid provided');
        if (!options.bytes) throw new ControllerError(500, 'No options.bytes provided');
    }

    static roomUserCountExceedsLimit(options = { room_uuid: null, add_count: null }) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new ControllerError(500, 'Invalid options provided');
        }
        if (!options.room_uuid) throw new ControllerError(500, 'No options.room_uuid provided');
        if (!options.add_count) throw new ControllerError(500, 'No options.add_count provided');
    }

    static channelCountExceedsLimit(options = { room_uuid: null, add_count: null }) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new ControllerError(500, 'Invalid options provided');
        }
        if (!options.room_uuid) throw new ControllerError(500, 'No options.room_uuid provided');
        if (!options.add_count) throw new ControllerError(500, 'No options.add_count provided');
    }
};
