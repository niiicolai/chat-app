import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../../../sequelize/models/index.cjs';
import ControllerError from '../../errors/controller_error.js';
import StorageService from '../storage_service.js';
import RoomPermissionService from './room_permission_service.js';

const storage = new StorageService('room_avatar');

const dto = (m) => {
    const res = {
        uuid: m.room_uuid,
        name: m.room_name,
        description: m.room_description,
        room_category_name: m.room_category_name,
        bytes_used: parseFloat(m.bytes_used),
        mb_used: parseFloat(m.mb_used),
    };

    res.joinSettings = {
        channelUuid: m.join_channel_uuid,
        message: m.join_message,
    };

    res.rulesSettings = {
        text: m.rules_text,
    };

    res.userSettings = {
        maxUsers: m.max_users,
    };

    res.channelSettings = {
        maxChannels: m.max_channels,
        messagesDaysToLive: m.message_days_to_live,
    };

    res.fileSettings = {
        totalFilesBytesAllowed: m.total_files_bytes_allowed,
        singleFileBytesAllowed: m.single_file_bytes_allowed,
        fileDaysToLive: m.file_days_to_live,
        totalFilesMb: parseFloat(m.total_files_mb),
        singleFileMb: parseFloat(m.single_file_mb),
    };

    if (m.room_avatar_uuid) {
        res.avatar = {
            uuid: m.room_avatar_uuid,
        };

        if (m.room_file_uuid) {
            res.avatar.room_file = {
                uuid: m.room_file_uuid,
                src: m.room_file_src,
                room_file_type_name: m.room_file_type_name,
                size: parseFloat(m.room_file_size),
                sizeMb: parseFloat(m.room_file_size_mb),
            };
        }
    }

    return res;
};

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.RoomView, dto);
    }

    includeUser(user_uuid) {
        return [{
            model: db.RoomUserView,
            where: { user_uuid },
        }];
    }

    async findOne(options = { room_uuid: null, user: null }) {
        const { user, room_uuid } = options;
        const { sub: user_uuid } = user;
        if (!user_uuid) {
            throw new ControllerError(400, 'No user_uuid provided');
        }
        return await super.findOne({ ...options, include: this.includeUser(user_uuid) });
    }

    async findAll(options = { user: null }) {
        const { sub: user_uuid } = options.user;
        if (!user_uuid) {
            throw new ControllerError(400, 'No user_uuid provided');
        }

        return await super.findAll({ ...options, include: this.includeUser(user_uuid) });
    }

    async create(options = { body: null, file: null, user: null }) {
        const { body, file, user } = options;

        if (!body) {
            throw new ControllerError(400, 'No body provided');
        }
        if (!body.uuid) {
            throw new ControllerError(400, 'No UUID provided');
        }
        if (!body.name) {
            throw new ControllerError(400, 'No name provided');
        }
        if (!body.description) {
            throw new ControllerError(400, 'No description provided');
        }
        if (!body.room_category_name) {
            throw new ControllerError(400, 'No room_category_name provided');
        }

        if (await db.RoomView.findOne({ where: { room_uuid: body.uuid } })) {
            throw new ControllerError(400, 'Room with this UUID already exists');
        }

        const nameCheck = await db.RoomView.findOne({ where: { room_name: body.name } });
        if (nameCheck) {
            throw new ControllerError(400, 'Room with this name already exists');
        }

        if (file) {
            if (file.size > parseFloat(process.env.ROOM_TOTAL_UPLOAD_SIZE)) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if (file.size > parseFloat(process.env.ROOM_UPLOAD_SIZE)) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }
            body.src = await storage.uploadFile(file, body.uuid);
            body.bytes = file.size;
        }

        await db.sequelize.query('CALL create_room_proc(:user_uuid, :room_uuid, :name, :description, :room_category_name, :room_user_role, :src, :bytes, @result)', {
            replacements: {
                user_uuid: user.sub,
                room_uuid: body.uuid,
                name: body.name,
                description: body.description,
                room_category_name: body.room_category_name,
                room_user_role: "Admin",
                src: body.src || null,
                bytes: body.bytes || null,
            },
        });

        return await service.findOne({ room_uuid: body.uuid, user });
    }

    async update(options = { room_uuid: null, body: null, file: null, user: null }) {
        const { room_uuid, body, file, user } = options;
        const { name, description, room_category_name } = body;

        if (!room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        const existing = await service.findOne({ room_uuid, user });
        if (!existing) {
            throw new ControllerError(404, 'Room not found');
        }

        if (!name) {
            body.name = existing.name;
        }

        if (!description) {
            body.description = existing.description;
        }

        if (!room_category_name) {
            body.room_category_name = existing.room_category_name;
        }

        if (file) {
            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid, bytes: file.size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid, bytes: file.size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }
            body.src = await storage.uploadFile(file, room_uuid);
            body.bytes = file.size;
        } else {
            body.src = existing.avatar?.room_file?.src;
            body.bytes = existing.avatar?.room_file?.size;
        }

        await db.sequelize.query('CALL edit_room_proc(:room_uuid, :name, :description, :room_category_name, :src, :bytes, @result)', {
            replacements: {
                room_uuid,
                name: body.name,
                description: body.description,
                room_category_name: body.room_category_name,
                src: body.src || null,
                bytes: body.bytes || null,
            },
        });

        return await service.findOne({ room_uuid, user });
    }

    async destroy(options = { room_uuid: null, user: null }) {
        const { room_uuid, user } = options;

        if (!room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        const existing = await service.findOne({ room_uuid, user });
        if (!existing) {
            throw new ControllerError(404, 'Room not found');
        }

        await db.sequelize.query('CALL delete_room_proc(:room_uuid, @result)', {
            replacements: {
                room_uuid,
            },
        });
    }

    async editSettings(options = { room_uuid: null, body: null, user: null }) {
        const { room_uuid, body, user } = options;
        const { join_message, rules_text, join_channel_uuid } = body;

        if (!room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        const existing = await service.findOne({ room_uuid, user });
        if (!existing) {
            throw new ControllerError(404, 'Room not found');
        }

        if (!join_message) {
            body.join_message = existing.join_message;
        } else {
            // Check if the message includes {name}
            if (join_message.includes('{name}')) {
                body.join_message = join_message;
            } else {
                throw new ControllerError(400, 'Join message must include {name}');
            }
        }

        if (!rules_text) {
            body.rules_text = existing.rules_text;
        }

        if (!join_channel_uuid) {
            body.join_channel_uuid = existing.join_channel_uuid;
        }

        await db.sequelize.query('CALL edit_room_setting_proc(:room_uuid, :join_message, :join_channel_uuid, :rules_text, @result)', {
            replacements: {
                room_uuid,
                join_message: body.join_message,
                join_channel_uuid: body.join_channel_uuid || null,
                rules_text: body.rules_text,
            },
        });
    }

    async leave(options = { room_uuid: null, user: null }) {
        const { room_uuid, user } = options;
        const { sub: user_uuid } = user;

        if (!room_uuid) {
            throw new ControllerError(400, 'No room_uuid provided');
        }

        if (!user_uuid) {
            throw new ControllerError(400, 'No user_uuid provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const existing = await service.findOne({ room_uuid, user });
        if (!existing) {
            throw new ControllerError(404, 'Room not found');
        }

        await db.sequelize.query('CALL leave_room_proc(:user_uuid, :room_uuid, @result)', {
            replacements: {
                user_uuid,
                room_uuid,
            },
        });
    }
};

const service = new Service();

export default service;
