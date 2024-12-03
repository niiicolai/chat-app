import Validator from '../../shared/validators/room_service_validator.js';
import err from '../../shared/errors/index.js';
import StorageService from '../../shared/services/storage_service.js';
import RPS from './room_permission_service.js';
import dto from '../dto/room_dto.js';
import Room from '../mongoose/models/room.js';
import RoomCategory from '../mongoose/models/room_category.js';
import RoomFile from '../mongoose/models/room_file.js';
import mongoose from '../mongoose/index.js';
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

/**
 * @constant storage
 * @description Storage service instance
 * @type {StorageService}
 */
const storage = new StorageService('room_avatar');

/**
 * @class RoomService
 * @description Service class for rooms.
 * @exports RoomService
 */
class RoomService {

    /**
     * @function findOne
     * @description Find a room by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async findOne(options = { uuid: null, user: null }) {
        Validator.findOne(options);

        const { uuid: _id, user } = options;
        const room = await Room.findOne({ _id })
            .populate('room_avatar.room_file');

        if (!room) throw new err.EntityNotFoundError('room');

        const isInRoom = await RPS.isInRoom({ room_uuid: _id, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        return dto(room._doc);
    }

    /**
     * @function findAll
     * @description Find all rooms
     * @param {Object} options
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @param {Number} options.page optional
     * @param {Number} options.limit optional
     * @returns {Promise<Object>}
     */
    async findAll(options = { user: null, page: null, limit: null }) {
        options = Validator.findAll(options);

        const { user, page, limit, offset } = options;
        const savedUser = await User.findOne({ _id: user.sub });

        if (!savedUser) throw new err.EntityNotFoundError('user');

        const params = { room_users: { $elemMatch: { user: savedUser._id } } };
        const [total, rooms] = await Promise.all([
            Room.find(params).countDocuments(),
            Room.find(params)
                .populate('room_avatar.room_file')
                .sort({ created_at: -1 })
                .limit(limit || 0)
                .skip((page && limit) ? offset : 0),
        ]);

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

    /**
     * @function create
     * @description Create a room
     * @param {Object} options
     * @param {Object} options.body
     * @param {String} options.body.uuid
     * @param {String} options.body.name
     * @param {String} options.body.description
     * @param {String} options.body.room_category_name
     * @param {Object} options.file optional
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, file: null, user: null }) {
        Validator.create(options);

        const { body, file, user } = options;
        const { uuid, name, description, room_category_name } = body;
        const avatar_src = (file && file.size > 0 ? await storage.uploadFile(file, uuid) : null);

        const isVerified = await RPS.isVerified({ user });
        if (!isVerified) throw new err.VerifiedEmailRequiredError("create a room");

        const validCategory = await RoomCategory.findOne({ _id: room_category_name });
        if (!validCategory) throw new err.EntityNotFoundError('room_category_name');

        const uuidInUse = await Room.findOne({ _id: uuid });
        if (uuidInUse) throw new err.DuplicateEntryError('room', 'PRIMARY', uuid);

        const nameInUse = await Room.findOne({ name });
        if (nameInUse) throw new err.DuplicateEntryError('room', 'room_name', name);

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            await Room.insertMany([{
                _id: uuid,
                name,
                description,
                room_category: room_category_name,
                room_join_settings: {
                    _id: uuidv4(),
                    join_message
                },
                room_file_settings: {
                    _id: uuidv4(),
                    file_days_to_live,
                    total_files_bytes_allowed,
                    single_file_bytes_allowed
                },
                room_user_settings: {
                    _id: uuidv4(),
                    max_users
                },
                room_channel_settings: {
                    _id: uuidv4(),
                    max_channels,
                    message_days_to_live
                },
                room_rules_settings: {
                    _id: uuidv4(),
                    rules_text
                },
                room_avatar: {
                    _id: uuidv4(),
                },
                room_invite_links: [{
                    _id: uuidv4(),
                    expires_at: null
                }],
                room_users: [{
                    _id: uuidv4(),
                    room_user_role: "Admin",
                    user: user.sub
                }],
            }], { session });

            if (avatar_src) {
                const roomFileUuid = uuidv4();
                await RoomFile.insertMany([{
                    _id: roomFileUuid,
                    src: avatar_src,
                    size: file.size,
                    room_file_type: "RoomAvatar",
                    room: uuid,
                }], { session });
                await Room.findOneAndUpdate(
                    { _id: uuid },
                    { 'room_avatar.room_file': roomFileUuid },
                    { session }
                );
            }

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            // Delete the avatar file if it was uploaded
            if (avatar_src) storage.deleteFile(storage.parseKey(avatar_src));

            throw error;
        } finally {
            session.endSession();
        }

        return dto(await Room.findOne({ _id: uuid }).populate('room_avatar.room_file'));
    }

    /**
     * @function update
     * @description Update a room by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.body
     * @param {String} options.body.name optional
     * @param {String} options.body.description optional
     * @param {String} options.body.room_category_name optional
     * @param {Object} options.file optional
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async update(options = { uuid: null, body: null, file: null, user: null }) {
        Validator.update(options);

        const { uuid, body, file, user } = options;
        const { name, description, room_category_name } = body;

        const room = await Room.findOne({ _id: uuid })
            .populate('room_avatar.room_file');
        if (!room) throw new err.EntityNotFoundError('room');

        const isAdmin = await RPS.isInRoom({ room_uuid: uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        if (room_category_name) {
            const validCategory = await RoomCategory.findOne({ _id: room_category_name });
            if (!validCategory) throw new err.EntityNotFoundError('room_category_name');
        }

        let avatar_src = null;
        if (file && file.size > 0) {
            const [exceedsTotal, exceedsSingle] = await Promise.all([
                RPS.fileExceedsTotalFilesLimit({ room_uuid: uuid, bytes: file.size }),
                RPS.fileExceedsSingleFileSize({ room_uuid: uuid, bytes: file.size }),
            ]);
            if (exceedsTotal) throw new err.ExceedsRoomTotalFilesLimitError();
            if (exceedsSingle) throw new err.ExceedsSingleFileSizeError();

            avatar_src = await storage.uploadFile(file, uuid);
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const newRoomFileUuid = uuidv4();
            const oldRoomFile = room.room_avatar.room_file;
            if (avatar_src) {
                await RoomFile.insertMany([{
                    _id: newRoomFileUuid,
                    src: avatar_src,
                    size: file.size,
                    room_file_type: "RoomAvatar",
                    room: uuid,
                }], { session });
            }

            await Room.findOneAndUpdate(
                { _id: uuid },
                {
                    $set: {
                        ...(name && { name }),
                        ...(description && { description }),
                        ...(room_category_name && { room_category: room_category_name }),
                        ...(newRoomFileUuid && { 'room_avatar.room_file': newRoomFileUuid }),
                    }
                },
                { session }
            )

            if (oldRoomFile) {
                await RoomFile.deleteOne({ _id: oldRoomFile._id }, { session });
                // Must be last to ensure the deletion of the
                // old file is the last operation in the transaction.
                const key = storage.parseKey(oldRoomFile.src);
                await storage.deleteFile(key);
            }

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            // Delete the avatar file if it was uploaded
            if (avatar_src) storage.deleteFile(storage.parseKey(avatar_src));
            if (error?.errorResponse?.code === 11000) {
                if (error.keyPattern?.name) {
                    throw new err.DuplicateEntryError('room', 'room_name', name);
                } else if (error.keyPattern?._id) {
                    throw new err.DuplicateEntryError('room', 'PRIMARY', uuid);
                }
            } else {
                console.error(error);
                console.error(JSON.stringify(error, null, 2));
            }
            throw error;
        } finally {
            session.endSession();
        }

        return dto(await Room.findOne({ _id: uuid }).populate('room_avatar.room_file'));
    }

    /**
     * @function destroy
     * @description Destroy a room by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null, user: null }) {
        Validator.destroy(options);

        const { uuid, user } = options;

        const room = await Room.findOne({ _id: uuid }).populate('room_avatar.room_file');;
        if (!room) throw new err.EntityNotFoundError('room');

        const isAdmin = await RPS.isInRoom({ room_uuid: uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            await RoomFile.deleteMany({ room: room._id }, { session });
            await Channel.deleteMany({ room: room._id }, { session });
            await ChannelMessage.deleteMany({ 'channel.room': room._id }, { session });
            await Room.deleteOne({ _id: uuid }, { session });

            if (room.room_avatar.room_file) {
                const key = storage.parseKey(room.room_avatar.room_file.src);
                await storage.deleteFile(key);
            }

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * @function editSettings
     * @description Edit room settings
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.body
     * @param {String} options.body.join_message optional
     * @param {String} options.body.rules_text optional
     * @param {String} options.body.join_channel_uuid optional
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<void>}
     */
    async editSettings(options = { uuid: null, body: null, user: null }) {
        Validator.editSettings(options);

        const { uuid, body, user } = options;
        const { join_message, rules_text, join_channel_uuid } = body;

        const room = await Room.findOne({ _id: uuid }).populate('room_avatar.room_file');;
        if (!room) throw new err.EntityNotFoundError('room');

        const isAdmin = await RPS.isInRoom({ room_uuid: uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        if (join_channel_uuid) {
            const channel = await Channel.findOne({ _id: join_channel_uuid });
            if (!channel) throw new err.EntityNotFoundError('join_channel_uuid');
        }

        if (join_message && !join_message.includes('{name}')) {
            throw new err.ControllerError(400, 'Join message must include {name}');
        }

        await Room.findOneAndUpdate(
            { _id: uuid },
            {
                $set: {
                    ...(join_message && { 'room_join_settings.join_message': join_message }),
                    ...(join_channel_uuid && { 'room_join_settings.join_channel': join_channel_uuid }),
                    ...(rules_text && { 'room_rules_settings.rules_text': rules_text }),
                }
            }
        );
    }

    /**
     * @function leave
     * @description Leave a room by uuid
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<void>}
     */
    async leave(options = { uuid: null, user: null }) {
        RoomServiceValidator.leave(options);

        const { uuid, user } = options;
        const room = await Room.findOne({ _id: uuid });
        if (!room) throw new err.EntityNotFoundError('room');

        const isInRoom = await RPS.isInRoom({ room_uuid: uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        await Room.findOneAndUpdate(
            { _id: uuid },
            { $pull: { room_users: { user: user.sub } } }
        );
    }
};

const service = new RoomService();

export default service;
