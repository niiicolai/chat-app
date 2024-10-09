import MysqlBaseFindService from './_mysql_base_find_service.js';
import db from '../sequelize/models/index.cjs';
import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/room_dto.js';

const storage = new StorageService('room_avatar');

class Service extends MysqlBaseFindService {
    constructor() {
        super(db.RoomView, dto);
    }

    includeUser(user_uuid) {
        if (!user_uuid) {
            throw new ControllerError(500, 'includeUser: No user_uuid provided');
        }

        return [{
            model: db.RoomUserView,
            where: { user_uuid },
        }];
    }

    async findOne(options = { uuid: null, user: null }) {
        const { user, uuid } = options;
        const { sub: user_uuid } = user;

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        return await super.findOne({ uuid, include: this.includeUser(user_uuid) });
    }

    async findAll(options = { user: null, page: null, limit: null }) {
        const { user, page, limit } = options;
        const { sub: user_uuid } = options.user;

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        return await super.findAll({ page, limit, include: this.includeUser(user_uuid) });
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
        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isVerified({ user }))) {
            throw new ControllerError(403, 'You must verify your email before you can create a room');
        }

        if (await db.RoomView.findOne({ where: { room_uuid: body.uuid } })) {
            throw new ControllerError(400, 'Room with this UUID already exists');
        }

        const nameCheck = await db.RoomView.findOne({ where: { room_name: body.name } });
        if (nameCheck) {
            throw new ControllerError(400, 'Room with this name already exists');
        }

        if (file && file.size > 0) {
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

        return await service.findOne({ uuid: body.uuid, user });
    }

    async update(options = { uuid: null, body: null, file: null, user: null }) {
        const { uuid, body, file, user } = options;
        const { name, description, room_category_name } = body;

        if (!uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }
        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid: uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        const existing = await service.findOne({ uuid, user });
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

        if (file && file.size > 0) {
            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid: uuid, bytes: file.size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid: uuid, bytes: file.size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }
            body.src = await storage.uploadFile(file, uuid);
            body.bytes = file.size;
        } else {
            body.src = existing.avatar?.room_file?.src;
            body.bytes = existing.avatar?.room_file?.size;
        }

        await db.sequelize.query('CALL edit_room_proc(:uuid, :name, :description, :room_category_name, :src, :bytes, @result)', {
            replacements: {
                uuid,
                name: body.name,
                description: body.description,
                room_category_name: body.room_category_name,
                src: body.src || null,
                bytes: body.bytes || null,
            },
        });

        return await service.findOne({ uuid, user });
    }

    async destroy(options = { uuid: null, user: null }) {
        const { uuid, user } = options;

        if (!uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid: uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        await service.findOne({ uuid, user });
        await db.sequelize.query('CALL delete_room_proc(:uuid, @result)', {
            replacements: { uuid }
        });
    }

    async editSettings(options = { uuid: null, body: null, user: null }) {
        const { uuid, body, user } = options;
        const { join_message, rules_text, join_channel_uuid } = body;

        if (!uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid: uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        const existing = await service.findOne({ uuid, user });

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

        await db.sequelize.query('CALL edit_room_setting_proc(:uuid, :join_message, :join_channel_uuid, :rules_text, @result)', {
            replacements: {
                uuid,
                join_message: body.join_message,
                join_channel_uuid: body.join_channel_uuid || null,
                rules_text: body.rules_text,
            },
        });
    }

    async leave(options = { uuid: null, user: null }) {
        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        if (!uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid: uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        await service.findOne({ uuid, user });
        await db.sequelize.query('CALL leave_room_proc(:user_uuid, :uuid, @result)', {
            replacements: {
                user_uuid,
                uuid,
            },
        });
    }
};

const service = new Service();

export default service;
