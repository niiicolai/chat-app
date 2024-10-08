import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../sequelize/models/index.cjs';
import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/channel_dto.js';

const storage = new StorageService('channel_avatar');

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.ChannelView, dto);
    }

    async findOne(options = { uuid: null, user: null }) {
        const { user, uuid } = options;
        const r = await super.findOne({ uuid });

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: r.uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return r;
    }

    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        const { room_uuid, user, page, limit } = options;

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }
        if (!room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }
        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return await super.findAll({ page, limit, where: { room_uuid }});
    }

    async create(options={ body: null, file: null, user: null }) {
        const { body, file, user } = options;
        const { uuid, name, description, channel_type_name, room_uuid } = body;

        if (!body) {
            throw new ControllerError(400, 'No body provided');
        }
        if (!uuid) {
            throw new ControllerError(400, 'No UUID provided');
        }
        if (!name) {
            throw new ControllerError(400, 'No name provided');
        }
        if (!description) {
            throw new ControllerError(400, 'No description provided');
        }
        if (!channel_type_name) {
            throw new ControllerError(400, 'No channel_type_name provided');
        }
        if (!room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }
        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        if (await RoomPermissionService.channelCountExceedsLimit({ room_uuid, add_count: 1 })) {
            throw new ControllerError(400, 'Room channel count exceeds limit. The room cannot have more channels');
        }

        if (file && file.size > 0) {
            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid, bytes: file.size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid, bytes: file.size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }
            body.src = await storage.uploadFile(file, uuid);
            body.bytes = file.size;
        }

        if (await db.ChannelView.findOne({ where: { channel_uuid: uuid } })) {
            throw new ControllerError(400, 'Channel with that UUID already exists');
        }

        const nameAndTypeCheck = await db.ChannelView.findOne({ where: { channel_name: name, channel_type_name, room_uuid } });
        if (nameAndTypeCheck) {
            throw new ControllerError(400, 'Channel with that name and type already exists');
        }

        await db.sequelize.query('CALL create_channel_proc(:uuid, :name, :description, :channel_type_name, :bytes, :upload_src, :room_uuid, @result)', {
            replacements: {
                uuid,
                name,
                description,
                channel_type_name,
                bytes: body.bytes || null,
                upload_src: body.src || null,
                room_uuid,
            },
        });

        return await service.findOne({ uuid, user });
    }

    async update(options={ uuid: null, body: null, file: null, user: null }) {
        const { uuid, body, file, user } = options;
        const { name, description } = body;

        if (!uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }
        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        const existing = await service.findOne({ uuid, user });

        if (!name) {
            body.name = existing.name;
        }

        if (!description) {
            body.description = existing.description;
        }
        
        const room_uuid = existing.room_uuid;
        body.channel_type_name = existing.channel_type_name;
        
        if (file && file.size > 0) {
            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid, bytes: file.size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid, bytes: file.size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }
            body.src = await storage.uploadFile(file, uuid);
            body.bytes = file.size;
        } else {
            body.src = existing.room_file_src;
            body.bytes = existing.room_file_size;
        }

        await db.sequelize.query('CALL edit_channel_proc(:uuid, :name, :description, :channel_type_name, :bytes, :src, :room_uuid, @result)', {
            replacements: {
                uuid,
                name: body.name,
                description: body.description,
                channel_type_name: body.channel_type_name,
                src: body.src || null,
                bytes: body.bytes  || null,
                room_uuid,
            },
        });

        return await service.findOne({ uuid, user });
    }

    async destroy(options={ uuid: null, user: null }) {
        const { uuid, user } = options;

        if (!uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }
        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid: uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        // Ensure the channel exists
        await service.findOne({ uuid, user });
        await db.sequelize.query('CALL delete_channel_proc(:uuid, @result)', {
            replacements: {
                uuid,
            },
        });
    }
}

const service = new Service();

export default service;
