import RoomFileServiceValidator from '../../shared/validators/room_file_service_validator.js';
import MysqlBaseFindService from './_mysql_base_find_service.js';
import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/room_file_dto.js';
import db from '../sequelize/models/index.cjs';

const storage = new StorageService('room_file');

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.RoomFileView, dto);
    }

    async findOne(options = { uuid: null, user: null }) {
        RoomFileServiceValidator.findOne(options);
        const { user, uuid } = options;
        const r = await super.findOne({ uuid });

        if (!(await RoomPermissionService.isInRoom({ room_uuid: r.room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return r;
    }

    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        options = RoomFileServiceValidator.findAll(options);
        const { room_uuid, user, page, limit } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return await super.findAll({ page, limit, where: { room_uuid } });
    }

    async destroy(options = { uuid: null, user: null }) {
        RoomFileServiceValidator.destroy(options);
        const { uuid, user } = options;

        const existing = await service.findOne({ uuid, user });
        const { room_file_type_name } = existing;
        const isMessageUpload = room_file_type_name === 'MessageUpload';
        const [owner, admin, moderator] = await Promise.all([
            this.isOwner({ uuid, isMessageUpload, user }),
            RoomPermissionService.isInRoom({ room_uuid: existing.room_uuid, user, role_name: 'Admin' }),
            RoomPermissionService.isInRoom({ room_uuid: existing.room_uuid, user, role_name: 'Moderator' }),
        ]);

        if (!owner && !admin && !moderator) {
            throw new ControllerError(403, 'User is not an owner of the file, or an admin or moderator of the room');
        }

        await db.sequelize.query('CALL delete_room_file_proc(:uuid, @result)', {
            replacements: {
                uuid,
            },
        });

        const result = await db.sequelize.query('SELECT @result as result');

        /**
         * If the file was successfully deleted from the database, 
         * delete the file from storage as well
         */
        if (result[0][0].result === 1) {
            const key = storage.parseKey(existing.src);
            storage.deleteFile(key);
        }
    }

    async isOwner(options = { uuid: null, isMessageUpload: null, user: null }) {
        RoomFileServiceValidator.isOwner(options);
        const { uuid, isMessageUpload, user } = options;
        const { sub: user_uuid } = user;

        if (isMessageUpload) {
            const { messageUpload } = await db.ChannelMessage.findOne({ include: [{ model: db.ChannelMessageUpload, where: { uuid } }] });
            if (messageUpload && messageUpload.user_uuid === user_uuid) {
                return true;
            }            
        }
        return false;
    }
};

const service = new Service();

export default service;
