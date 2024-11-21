import RoomPermissionServiceValidator from '../../shared/validators/room_permission_service_validator.js';
import db from '../sequelize/models/index.cjs';

class RoomPermissionService {

    async isVerified(options = { user: null }) {
        RoomPermissionServiceValidator.isVerified(options);

        const { user } = options;
        const { sub: user_uuid } = user;
        const exists = await db.UserEmailVerificationView.findOne({
            where: {
                user_uuid,
            },
        });

        return exists && exists.user_email_verified;
    }

    async isInRoom(options = { room_uuid: null, user: null, role_name: null }) {
        RoomPermissionServiceValidator.isInRoom(options);

        const { room_uuid, user } = options;
        const { sub: user_uuid } = user;
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
        RoomPermissionServiceValidator.isInRoomByChannel(options);

        const { channel_uuid, user } = options;
        const { sub: user_uuid } = user;
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
        RoomPermissionServiceValidator.fileExceedsTotalFilesLimit(options);

        const { room_uuid, bytes } = options;
        await db.sequelize.query('CALL check_upload_exceeds_total_proc(:bytes, :room_uuid, @result)', {
            replacements: {
                bytes,
                room_uuid,
            },
        });
        
        const [[{ result }]] = await db.sequelize.query('SELECT @result AS result');
        const exceeds = result === 1;
        console.log(exceeds);
        return exceeds;
    }

    async fileExceedsSingleFileSize(options = { room_uuid: null, bytes: null }) {
        RoomPermissionServiceValidator.fileExceedsSingleFileSize(options);

        const { room_uuid, bytes } = options;
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
        RoomPermissionServiceValidator.roomUserCountExceedsLimit(options);

        const { room_uuid, add_count } = options;

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
        RoomPermissionServiceValidator.channelCountExceedsLimit(options);

        const { room_uuid, add_count } = options;
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
