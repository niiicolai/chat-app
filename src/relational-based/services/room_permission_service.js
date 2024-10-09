import db from '../sequelize/models/index.cjs';
import ControllerError from '../../shared/errors/controller_error.js';

class RoomPermissionService {

    async isVerified(options = { user: null }) {
        const { user } = options;
        const { sub: user_uuid } = user;

        if (!user_uuid) {
            throw new ControllerError(400, 'isVerified: No user_uuid provided');
        }

        const exists = await db.UserEmailVerificationView.findOne({
            where: {
                user_uuid,
            },
        });

        return exists && exists.user_email_verified;
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

        const exists = await db.RoomUserView.findOne({
            where: {
                room_uuid,
                user_uuid,
            },
        });

        if (exists) {
            if (options.role_name && exists.room_user_role_name !== options.role_name) {
                return false;
            }

            return true;
        }

        return false;
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

        const ch = await db.ChannelView.findOne({
            where: {
                channel_uuid,
            },
        });
        const exists = await db.RoomUserView.findOne({
            where: {
                room_uuid: ch.room_uuid,
                user_uuid,
            },
        });

        if (exists) {
            if (options.role_name && exists.room_user_role_name !== options.role_name) {
                return false;
            }

            return true;
        }

        return false;
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
        const exceeds = result === 1;
        return exceeds;
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
        const exceeds = result === 1;
        return exceeds;
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
        const exceeds = result === 1;
        return exceeds;
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
        const exceeds = result === 1;
        return exceeds;
    }
}

const service = new RoomPermissionService();

export default service;
