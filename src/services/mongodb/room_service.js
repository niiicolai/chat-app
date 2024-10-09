import MongodbBaseFindService from './_mongodb_base_find_service.js';
import ControllerError from '../../errors/controller_error.js';
import StorageService from '../storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import roomDto from '../../dto/room_dto.js';
import roomJoinSettingsDto from '../../dto/room_join_settings_dto.js';
import roomFileSettingsDto from '../../dto/room_file_settings_dto.js';
import roomUserSettingsDto from '../../dto/room_user_settings_dto.js';
import roomChannelSettingsDto from '../../dto/room_channel_settings_dto.js';
import roomRulesSettingsDto from '../../dto/room_rules_settings_dto.js';
import roomAvatarDto from '../../dto/room_avatar_dto.js';
import roomFileDto from '../../dto/room_file_dto.js';
import Room from '../../../mongoose/models/room.js';
import RoomJoinSettings from '../../../mongoose/models/room_join_settings.js';
import RoomFileSettings from '../../../mongoose/models/room_file_settings.js';
import RoomChannelSettings from '../../../mongoose/models/room_channel_settings.js';
import RoomUserSettings from '../../../mongoose/models/room_user_settings.js';
import RoomRulesSettings from '../../../mongoose/models/room_rules_settings.js';
import RoomAvatar from '../../../mongoose/models/room_avatar.js';
import RoomCategory from '../../../mongoose/models/room_category.js';
import RoomFile from '../../../mongoose/models/room_file.js';
import RoomFileType from '../../../mongoose/models/room_file_type.js';
import RoomUser from '../../../mongoose/models/room_user.js';
import RoomUserRole from '../../../mongoose/models/room_user_role.js';
import Channel from '../../../mongoose/models/channel.js';
import User from '../../../mongoose/models/user.js';
import { v4 as uuidv4 } from 'uuid';

const max_users = parseInt(process.env.ROOM_MAX_MEMBERS || 25);
const max_channels = parseInt(process.env.ROOM_MAX_CHANNELS || 5);
const message_days_to_live = parseInt(process.env.ROOM_MESSAGE_DAYS_TO_LIVE || 30);
const file_days_to_live = parseInt(process.env.ROOM_FILE_DAYS_TO_LIVE || 30);
const total_files_bytes_allowed = parseInt(process.env.ROOM_TOTAL_UPLOAD_SIZE || 52428800);
const single_file_bytes_allowed = parseInt(process.env.ROOM_UPLOAD_SIZE || 5242880);
const join_message = process.env.ROOM_JOIN_MESSAGE || "Welcome to the room!";
const rules_text = process.env.ROOM_RULES_TEXT || "# Rules\n 1. No Spamming!";

const storage = new StorageService('room_avatar');

const dto = (m) => {
    const res = roomDto(m, 'mongodb');

    res.joinSettings = roomJoinSettingsDto(m.room_join_settings, 'mongodb');
    res.rulesSettings = roomRulesSettingsDto(m.room_rules_settings, 'mongodb');
    res.userSettings = roomUserSettingsDto(m.room_user_settings, 'mongodb');
    res.channelSettings = roomChannelSettingsDto(m.room_channel_settings, 'mongodb');
    res.fileSettings = roomFileSettingsDto(m.room_file_settings, 'mongodb');
    if (m.room_avatar) {
        res.avatar = roomAvatarDto(m, 'mongodb');
        if (m.room_avatar.room_file) {
            res.avatar.room_file = roomFileDto(m, 'mongodb');
        }
    }

    return res;
};

class Service extends MongodbBaseFindService {
    constructor() {
        super(Room, dto, 'uuid');
    }

    async findOne(options = { uuid: null, user: null }) {
        const { user, uuid } = options;

        if (!uuid) {
            throw new ControllerError(400, 'No uuid provided');
        }

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid: uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return super.findOne({ uuid }, (query) => query
            .populate('room_join_settings')
            .populate('room_rules_settings')
            .populate('room_user_settings')
            .populate('room_channel_settings')
            .populate('room_file_settings')            
            .populate('room_category')
            .populate('room_avatar')
            .populate('room_avatar.room_file')
        );
    }

    async findAll(options = { user: null, page: null, limit: null }) {
        const { user, page, limit } = options;

        if (!user) {
            throw new ControllerError(500, 'No user provided');
        }

        console.warn('room_service.findAll: no permissions check here');

        return await super.findAll({ page, limit }, (query) => query
            .populate('room_join_settings')
            .populate('room_rules_settings')
            .populate('room_user_settings')
            .populate('room_channel_settings')
            .populate('room_file_settings')     
            .populate('room_category')
            .populate('room_avatar')
            .populate('room_avatar.room_file')
        );
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

        if (await Room.findOne({ uuid: body.uuid })) {
            throw new ControllerError(400, 'Room with this UUID already exists');
        }

        if (await Room.findOne({ name: body.name })) {
            throw new ControllerError(400, 'Room with this name already exists');
        }

        const roomCategory = await RoomCategory.findOne({ name: body.room_category_name });
        if (!roomCategory) {
            throw new ControllerError(400, 'Room category not found');
        }

        /**
         * Create prerequisite settings
         * and add them to the room
         */
        const roomJoinSettings = await new RoomJoinSettings({ uuid: uuidv4(), join_message }).save();
        const roomFileSettings = await new RoomFileSettings({ uuid: uuidv4(), file_days_to_live, total_files_bytes_allowed, single_file_bytes_allowed }).save();
        const roomUserSettings = await new RoomUserSettings({ uuid: uuidv4(), max_users }).save();
        const roomChannelSettings = await new RoomChannelSettings({ uuid: uuidv4(), max_channels, message_days_to_live }).save();
        const roomRulesSettings = await new RoomRulesSettings({ uuid: uuidv4(), rules_text }).save();
        const roomAvatar = await new RoomAvatar({ uuid: uuidv4() }).save();

        const room = await new Room({
            uuid: body.uuid,
            name: body.name,
            description: body.description,
            room_category_name: roomCategory._id,
            room_join_settings: roomJoinSettings._id,
            room_file_settings: roomFileSettings._id,
            room_user_settings: roomUserSettings._id,
            room_channel_settings: roomChannelSettings._id,
            room_rules_settings: roomRulesSettings._id,
            room_avatar: roomAvatar._id,
        }).save();

        /**
         * Add the user to the room as an admin
         */
        const roomUserRole = await RoomUserRole.findOne({ name: 'Admin' });
        await new RoomUser({ uuid: uuidv4(), room: room._id, user: user._id, room_user_role: roomUserRole._id }).save();

        /**
         * Upload the avatar if it exists
         * and add it to the room
         */
        if (file && file.size > 0) {
            const size = file.size;

            if (size > parseFloat(process.env.ROOM_TOTAL_UPLOAD_SIZE)) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if (size > parseFloat(process.env.ROOM_UPLOAD_SIZE)) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }

            const src = await storage.uploadFile(file, body.uuid);
            const roomFileType = await RoomFileType.findOne({ name: "RoomAvatar" });
            const roomFile = await new RoomFile({
                uuid: uuidv4(),
                src,
                size,
                room_file_type: roomFileType._id,
                room: room._id,
            }).save();

            roomAvatar.room_file = roomFile._id;
            await roomAvatar.save();
        }

        return this.dto(room, 'mongodb');
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

        const existing = await Room.findOne({ uuid })
            .populate('room_category')
            .populate('room_avatar');
        if (!existing) {
            throw new ControllerError(404, 'Room not found');
        }

        if (!name) {
            body.name = existing.name;
        }

        if (!description) {
            body.description = existing.description;
        }

        let roomCategory = existing.room_category;
        if (room_category_name) {
            roomCategory = await RoomCategory.findOne({ name: room_category_name });
            if (!roomCategory) {
                throw new ControllerError(400, 'Room category not found');
            }
        }

        if (file && file.size > 0) {
            const size = file.size;
            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid: uuid, bytes: size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid: uuid, bytes: size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }
            const src = await storage.uploadFile(file, uuid);
            const roomFileType = await RoomFileType.findOne({ name: "RoomAvatar" });
            const roomFile = await new RoomFile({
                uuid: uuidv4(),
                src,
                size,
                room_file_type: roomFileType._id,
                room: existing._id,
            }).save();

            existing.room_avatar.room_file = roomFile._id;
            await existing.room_avatar.save();
        }

        const updatedRoom = await existing.updateOne({
            name: body.name,
            description: body.description,
            room_category: roomCategory._id,
        });

        return this.dto(updatedRoom, 'mongodb');
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

        const existing = await Room.findOne({ uuid });
        if (!existing) {
            throw new ControllerError(404, 'Room not found');
        }

        console.warn('room_service.destroy: not implemented yet');
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

        const existing = await Room.findOne({ uuid })
            .populate('room_join_settings')
            .populate('room_rules_settings');

        if (join_message || join_channel_uuid) {
            if (join_message) {
                if (!join_message.includes('{name}')) {
                    throw new ControllerError(400, 'Join message must include {name}');
                }
                existing.room_join_settings.join_message = join_message;
            }

            if (join_channel_uuid) {
                const ch = await Channel.findOne({ uuid: join_channel_uuid });
                if (!ch) {
                    throw new ControllerError(404, 'Channel not found');
                }
                existing.room_join_settings.join_channel_uuid = ch._id;
            }

            existing.room_join_settings.save();
        }

        if (rules_text) {
            existing.room_rules_settings.rules_text = rules_text;
            existing.room_rules_settings.save();
        }
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

        const existing = await Room.findOne({ uuid });
        if (!existing) {
            throw new ControllerError(404, 'Room not found');
        }

        const existingUser = await User.findOne({ uuid: user_uuid });
        if (!existingUser) {
            throw new ControllerError(404, 'User not found');
        }
        
        await RoomUser.findOneAndDelete({ room: existing._id, user: existingUser._id });
    }
};

const service = new Service();

export default service;
