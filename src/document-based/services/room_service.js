import RoomServiceValidator from '../../shared/validators/room_service_validator.js';
import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import dto from '../dto/room_dto.js';
import Room from '../mongoose/models/room.js';
import RoomCategory from '../mongoose/models/room_category.js';
import RoomFile from '../mongoose/models/room_file.js';
import RoomFileType from '../mongoose/models/room_file_type.js';
import RoomUserRole from '../mongoose/models/room_user_role.js';
import RoomAudit from '../mongoose/models/room_audit.js';
import RoomAuditType from '../mongoose/models/room_audit_type.js';
import ChannelMessage from '../mongoose/models/channel_message.js';
import Channel from '../mongoose/models/channel.js';
import User from '../mongoose/models/user.js';
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

const populate = (query) => query.populate({
    path: 'room_avatar',
    populate: {
        path: 'room_file',
        model: 'RoomFile'
    }
});

class Service {

    async findOne(options = { uuid: null, user: null }) {
        await RoomServiceValidator.findOne(options, RoomPermissionService);
        return dto(await populate(Room.findOne({ uuid: options.uuid })));
    }

    async findAll(options = { user: null, page: null, limit: null }) {
        options = RoomServiceValidator.findAll(options);

        const { user, page, limit, offset } = options;
        const savedUser = await User.findOne({ uuid: user.sub });

        if (!savedUser) throw new ControllerError(404, 'User not found');

        const params = { room_users: { $elemMatch: { user: savedUser._id } } };
        const total = await Room.find(params).countDocuments();
        const rooms = await populate(Room.find(params))
            .sort({ created_at: -1 })
            .limit(limit || 0)
            .skip((page && limit) ? offset : 0);

        const result = {
            total,
            data: await Promise.all(rooms.map(async (m) => {
                const roomFiles = await RoomFile.find({ room: m._id });
                const bytes_used = roomFiles.reduce((acc, curr) => acc + curr.size, 0);
                return dto({ ...m._doc, bytes_used });
            })),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };

        return result;
    }

    async create(options = { body: null, file: null, user: null }) {
        const { body, file, user } = options;
        await RoomServiceValidator.create(options, RoomPermissionService);

        const { uuid, name, description, room_category_name } = body;

        const [existingRoomByUUID, existingRoomByName, roomCategory, savedUser, roomUserRole] = await Promise.all([
            Room.findOne({ uuid }),
            Room.findOne({ name }),
            RoomCategory.findOne({ name: room_category_name }),
            User.findOne({ uuid: user.sub }),
            RoomUserRole.findOne({ name: 'Admin' }),
        ]);

        if (existingRoomByUUID) throw new ControllerError(400, 'Room with this UUID already exists');
        if (existingRoomByName) throw new ControllerError(400, 'Room with this name already exists');
        if (!roomCategory) throw new ControllerError(400, 'Room category not found');
        if (!savedUser) throw new ControllerError(404, 'User not found');
        if (!roomUserRole) throw new ControllerError(500, 'Admin role not found');

        const room = new Room({
            uuid,
            name,
            description,
            room_category: roomCategory,
            room_invite_links: [],
            room_users: [{ uuid: uuidv4(), user: savedUser._id, room_user_role: roomUserRole }],
            room_channel_settings: { uuid: uuidv4(), max_channels, message_days_to_live },
            room_join_settings: { uuid: uuidv4(), join_message },
            room_user_settings: { uuid: uuidv4(), max_users },
            room_rules_settings: { uuid: uuidv4(), rules_text },
            room_file_settings: {
                uuid: uuidv4(),
                file_days_to_live,
                total_files_bytes_allowed,
                single_file_bytes_allowed,
            },
            room_avatar: { uuid: uuidv4() },
        });

        if (file && file.size > 0) {
            const roomFileType = await RoomFileType.findOne({ name: "RoomAvatar" });
            if (!roomFileType) throw new ControllerError(500, 'Room avatar file type not found');

            const src = await storage.uploadFile(file, uuid);
            const roomFile = await new RoomFile({
                uuid: uuidv4(),
                src,
                size: file.size,
                room_file_type: roomFileType,
                room: room._id,
            }).save();

            room.room_avatar.room_file = roomFile._id;
        }

        const room_audit_type = await RoomAuditType.findOne({ name: 'ROOM_CREATED' });
        if (!room_audit_type) throw new ControllerError(500, 'Room audit type not found');

        await Promise.all([
            new RoomAudit({ uuid: uuidv4(), room: room._id, body: JSON.stringify(body), room_audit_type, user: savedUser._id }).save(),
            room.save()
        ]);

        return dto(room);
    }

    async update(options = { uuid: null, body: null, file: null, user: null }) {
        await RoomServiceValidator.update(options, RoomPermissionService);

        const { uuid, body, file } = options;
        const { name, description, room_category_name } = body;

        const room = await populate(Room.findOne({ uuid }));
        if (!room) throw new ControllerError(404, 'Room not found');

        if (name) room.name = name;
        if (description) room.description = description;
        if (room_category_name) {
            const roomCategory = await RoomCategory.findOne({ name: room_category_name });
            if (!roomCategory) throw new ControllerError(400, 'Room category not found');
            room.room_category = roomCategory;
        }

        if (file && file.size > 0) {
            const room_file_type = await RoomFileType.findOne({ name: "RoomAvatar" });
            if (!room_file_type) throw new ControllerError(500, 'Room avatar file type not found');

            const src = await storage.uploadFile(file, uuid);
            const roomFile = await new RoomFile({
                uuid: uuidv4(),
                src,
                size: file.size,
                room_file_type,
                room: room._id,
            }).save();

            room.room_avatar.room_file = roomFile._id;
        }

        await room.save();

        return dto(room);
    }

    async destroy(options = { uuid: null, user: null }) {
        await RoomServiceValidator.destroy(options, RoomPermissionService);

        const room = await Room.findOne({ uuid: options.uuid });
        if (!room) throw new ControllerError(404, 'Room not found');

        await Promise.all([
            RoomFile.deleteMany({ room: room._id }),
            Channel.deleteMany({ room: room._id }),
            ChannelMessage.deleteMany({ 'channel.room': room._id }),
            Room.deleteOne({ uuid: options.uuid }),
        ]);
    }

    async editSettings(options = { uuid: null, body: null, user: null }) {
        await RoomServiceValidator.editSettings(options, RoomPermissionService);

        const { uuid, body } = options;
        const { join_message, rules_text, join_channel_uuid } = body;

        const room = await Room.findOne({ uuid });
        if (!room) throw new ControllerError(404, 'Room not found');

        if (rules_text) room.room_rules_settings.rules_text = rules_text;

        if (join_message) {
            if (!join_message.includes('{name}')) {
                throw new ControllerError(400, 'Join message must include {name}');
            }
            room.room_join_settings.join_message = join_message;
        }

        if (join_channel_uuid) {
            const channel = await Channel.findOne({ uuid: join_channel_uuid });
            if (!channel) throw new ControllerError(404, 'Channel not found');
            room.room_join_settings.join_channel = channel._id;
        }

        await room.save();
    }

    async leave(options = { uuid: null, user: null }) {
        await RoomServiceValidator.leave(options, RoomPermissionService);

        const room = await Room.findOne({ uuid: options.uuid }).populate('room_users.user');
        const savedUser = await User.findOne({ uuid: options.user.sub });

        if (!room) throw new ControllerError(404, 'Room not found');
        if (!savedUser) throw new ControllerError(404, 'User not found');

        room.room_users = room.room_users.filter((m) => m.user.uuid !== options.user.sub);

        await room.save();
    }
};

const service = new Service();

export default service;
