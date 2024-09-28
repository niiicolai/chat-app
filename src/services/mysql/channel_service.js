import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';
import ControllerError from '../../errors/controller_error.js';
import StorageService from '../storage_service.js';
import RoomPermissionService from './room_permission_service.js';

const storage = new StorageService('channel_avatar');

const dto = (m) => {
    const res = {
        uuid: m.channel_uuid,
        name: m.channel_name,
        description: m.channel_description,
        channel_type_name: m.channel_type_name,
        created_at: m.channel_created_at,
        updated_at: m.channel_updated_at,
        room_uuid: m.room_uuid,
    };
    if (m.room_file_uuid) {
        res.room_file = {};
        res.room_file.uuid = m.room_file_uuid;
        res.room_file.src = m.room_file_src;
        res.room_file.room_file_type_name = m.room_file_type_name;
        res.room_file.size_bytes = m.room_file_size;
        res.room_file.size_mb = parseFloat(m.room_file_size_mb);
    }
    return res;
};

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.ChannelView, dto);
    }

    async findOne(options = { channel_uuid: null, user: null }) {
        const { channel_uuid, user } = options;
        if (!channel_uuid) {
            throw new ControllerError(400, 'No channel_uuid provided');
        }
        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: null }))) {
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
        return await super.findAll({...options, where: { room_uuid }});
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

        return await service.findOne({ channel_uuid: body.uuid, user });
    }

    async update(options={ channel_uuid: null, body: null, file: null, user: null }) {
        const { channel_uuid, body, file, user } = options;
        const { name, description } = body;

        if (!channel_uuid) {
            throw new ControllerError(400, 'No channel_uuid provided');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        const existing = await service.model.findOne({ where: { channel_uuid } });
        if (!existing) {
            throw new ControllerError(404, 'Channel not found');
        }

        if (!name) {
            body.name = existing.channel_name;
        }

        if (!description) {
            body.description = existing.channel_description;
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
            body.src = await storage.uploadFile(file, channel_uuid);
            body.bytes = file.size;
        } else {
            body.src = existing.room_file_src;
            body.bytes = existing.room_file_size;
        }

        await db.sequelize.query('CALL edit_channel_proc(:channel_uuid, :name, :description, :channel_type_name, :bytes, :src, :room_uuid, @result)', {
            replacements: {
                channel_uuid,
                name: body.name,
                description: body.description,
                channel_type_name: body.channel_type_name,
                src: body.src || null,
                bytes: body.bytes  || null,
                room_uuid,
            },
        });

        return await service.findOne({ channel_uuid, room_uuid, user });
    }

    async destroy(options={ channel_uuid: null, user: null }) {
        const { channel_uuid, user } = options;

        if (!channel_uuid) {
            throw new ControllerError(400, 'No channel_uuid provided');
        }

        if (!(await RoomPermissionService.isInRoomByChannel({ channel_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        const existing = await service.model.findOne({ where: { channel_uuid } });
        if (!existing) {
            throw new ControllerError(404, 'Channel not found');
        }

        await db.sequelize.query('CALL delete_channel_proc(:channel_uuid, @result)', {
            replacements: {
                channel_uuid,
            },
        });
    }
}

const service = new Service();

export default service;
