import db from '../../../sequelize/models/index.cjs';
import ControllerError from '../../errors/controller_error.js';

class RoomPermissionService {
    constructor() {
    }

    async isInRoom(options = { room_uuid: null, user: null, role_name: null }) {
        const { room_uuid, user } = options;
        const { sub: user_uuid } = user;
        if (!room_uuid) {
            throw new ControllerError(400, 'isInRoom: No room_uuid provided');
        }
        if (!user_uuid) {
            throw new ControllerError(400, 'isInRoom: No user_uuid provided');
        }

        await db.sequelize.query('CALL check_user_in_room_with_role_proc(:user_uuid, :room_uuid, :role_name, @result)', {
            replacements: {
                user_uuid,
                room_uuid,
                role_name: options.role_name || null,
            },
        });
        const [ [ { result } ] ] = await db.sequelize.query('SELECT @result AS result');
        return result === 1;
    }

    async isInRoomByChannel(options = { channel_uuid: null, user: null, role_name: null }) {
        const { channel_uuid, user } = options;
        const { sub: user_uuid } = user;
        if (!channel_uuid) {
            throw new ControllerError(400, 'isInRoomByChannel: No channel_uuid provided');
        }
        if (!user_uuid) {
            throw new ControllerError(400, 'isInRoomByChannel: No user_uuid provided');
        }

        await db.sequelize.query('CALL check_user_by_channel_uuid_in_room_with_role_proc(:user_uuid, :channel_uuid, :role_name, @result)', {
            replacements: {
                user_uuid,
                channel_uuid,
                role_name: options.role_name || null,
            },
        });
        const [[{ result }]] = await db.sequelize.query('SELECT @result AS result');
        return result === 1;
    }

    async fileExceedsTotalFilesLimit(options = { room_uuid: null, bytes: null }) {
        const { room_uuid, bytes } = options;
        if (!room_uuid) {
            throw new ControllerError(400, 'fileExceedsTotalFilesLimit: No room_uuid provided');
        }
        if (!bytes) {
            throw new ControllerError(400, 'fileExceedsTotalFilesLimit: No bytes provided');
        }

        await db.sequelize.query('CALL check_upload_exceeds_total_proc(:bytes, :room_uuid, @result)', {
            replacements: {
                bytes,
                room_uuid,
            },
        });
        const [[{ result }]] = await db.sequelize.query('SELECT @result AS result');
        return (result === 1);
    }

    async fileExceedsSingleFileSize(options = { room_uuid: null, bytes: null }) {
        const { room_uuid, bytes } = options;
        if (!room_uuid) {
            throw new ControllerError(400, 'fileExceedsSingleFileSize: No room_uuid provided');
        }
        if (!bytes) {
            throw new ControllerError(400, 'fileExceedsSingleFileSize: No bytes provided');
        }

        await db.sequelize.query('CALL check_upload_exceeds_single_proc(:bytes, :room_uuid, @result)', {
            replacements: {
                bytes,
                room_uuid,
            },
        });
        const [[{ result }]] = await db.sequelize.query('SELECT @result AS result');
        return result === 1;
    }

    async roomUserCountExceedsLimit(options = { room_uuid: null, add_count: null }) {
        const { room_uuid, add_count } = options;
        if (!room_uuid) {
            throw new ControllerError(400, 'roomUserCountExceedsLimit: No room_uuid provided');
        }
        if (!add_count) {
            throw new ControllerError(400, 'roomUserCountExceedsLimit: No add_count provided');
        }

        await db.sequelize.query('CALL check_users_exceeds_total_proc(:room_uuid, :add_count, @result)', {
            replacements: {
                room_uuid,
                add_count,
            },
        });
        const [[{ result }]] = await db.sequelize.query('SELECT @result AS result');
        return result === 1;
    }

    async channelCountExceedsLimit(options = { room_uuid: null, add_count: null }) {
        const { room_uuid, add_count } = options;
        if (!room_uuid) {
            throw new ControllerError(400, 'channelCountExceedsLimit: No room_uuid provided');
        }
        if (!add_count) {
            throw new ControllerError(400, 'channelCountExceedsLimit: No add_count provided');
        }

        await db.sequelize.query('CALL check_channels_exceeds_total_proc(:room_uuid, :add_count, @result)', {
            replacements: {
                room_uuid,
                add_count,
            },
        });
        const [[{ result }]] = await db.sequelize.query('SELECT @result AS result');
        return result === 1;
    }
}

const service = new RoomPermissionService();

export default service;
