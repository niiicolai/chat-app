import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';
import ControllerError from '../../errors/controller_error.js';
import StorageService from '../storage_service.js';
import RoomPermissionService from './room_permission_service.js';

const storage = new StorageService('room_file');

const dto = (m) => {
    const res = {
        uuid: m.room_file_uuid,
        src: m.room_file_src,
        size_bytes: m.room_file_size,
        size_mb: parseFloat(m.room_file_size_mb),
        room_file_type_name: m.room_file_type_name,
        room_uuid: m.room_uuid,
        created_at: m.room_file_created_at,
        updated_at: m.room_file_updated_at,
    };

    if (m.user_uuid) {
        res.user = {};
        res.user.uuid = m.user_uuid;
        res.user.username = m.user_username;
        res.user.avatar_src = m.user_avatar_src;
    }

    if (m.channel_message_upload_uuid) {
        res.channel_message_upload = {};
        res.channel_message_upload.uuid = m.channel_message_upload_uuid;
        res.channel_message_upload.channel_message_upload_type_name = m.channel_message_upload_type_name;
        res.channel_message_upload.channel_message = {
            uuid: m.channel_message_uuid,
            body: m.channel_message_body,
        };
    }

    return res;
};

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.RoomFileView, dto);
    }

    async findOne(options = { room_uuid: null, user: null }) {
        const { user, room_uuid } = options;
        if (!room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }
        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }
        return await super.findOne({ ...options });
    }

    async findAll(options = { room_uuid: null, user: null }) {
        const { room_uuid, user } = options;
        if (!room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }
        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }
        return await super.findAll({ ...options, where: { room_uuid } });
    }

    async destroy(options={ room_file_uuid: null, user: null }) {
        const { room_file_uuid, user } = options;
        const { sub: user_uuid } = user;

        if (!room_file_uuid) {
            throw new ControllerError(400, 'No room_file_uuid provided');
        }

        const existing = await service.model.findOne({ where: { room_file_uuid } });
        if (!existing) {
            throw new ControllerError(404, 'Room File not found');
        }

        const { room_file_type_name } = existing;
        const isMessageUpload = room_file_type_name === 'MessageUpload';

        if (!this.isOwner({ room_file_uuid, isMessageUpload, user }) && 
            isMessageUpload && !(await RoomPermissionService.isInRoom({ room_uuid: existing.room_uuid, user, role_name: 'Moderator' })) &&
            !(await RoomPermissionService.isInRoom({ room_uuid: existing.room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an owner of the file, or an admin or moderator of the room');
        }

        await db.sequelize.query('CALL delete_room_file_proc(:room_file_uuid, @result)', {
            replacements: {
                room_file_uuid,
            },
        });
        const result = await db.sequelize.query('SELECT @result as result');

        /**
         * If the file was successfully deleted from the database, 
         * delete the file from storage as well
         */
        if (result[0][0].result === 1) {
            const key = storage.parseKey(existing.room_file_src);
            storage.deleteFile(key);
        }
    }

    async isOwner(options = { room_file_uuid: null, isMessageUpload: null, user: null }) {
        const { room_file_uuid, isMessageUpload, user } = options;
        const { sub: user_uuid } = user;
        if (!room_file_uuid) {
            throw new ControllerError(400, 'isOwner: No room_file_uuid provided');
        }
        if (!user_uuid) {
            throw new ControllerError(400, 'isOwner: No user provided');
        }

        if (isMessageUpload) {
            const { messageUpload } = await db.ChannelMessage.findOne({ include: [{ model: db.ChannelMessageUpload, where: { room_file_uuid } }] });
            if (messageUpload && messageUpload.user_uuid === user_uuid) {
                return true;
            }            
        }
        return false;
    }
};

const service = new Service();

export default service;
