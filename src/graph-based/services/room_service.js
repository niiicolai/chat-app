import RoomServiceValidator from '../../shared/validators/room_service_validator.js';
import ControllerError from '../../shared/errors/controller_error.js';
import StorageService from '../../shared/services/storage_service.js';
import RoomPermissionService from './room_permission_service.js';
import ChannelService from './channel_service.js';
import RoomFileService from './room_file_service.js';
import NeodeBaseFindService from './neode_base_find_service.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/room_dto.js';
import { v4 as uuidv4 } from 'uuid';
import neo4j from 'neo4j-driver';

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
 * @description Service class for rooms
 * @exports RoomService
 */
class RoomService extends NeodeBaseFindService {
    constructor() {
        super('uuid', 'Room', dto);
    }

    async findOne(options = { uuid: null, user: null }) {
        RoomServiceValidator.findOne(options);

        const { user, uuid } = options;

        let room = await neodeInstance.model('Room').find(uuid);
        if (!room) throw new ControllerError(404, 'room not found');
        if (!(await RoomPermissionService.isInRoom({ room_uuid: uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        room = await neodeInstance.cypher(
            `MATCH (ru:RoomUser)-[:HAS_USER]->(u:User {uuid: $user_uuid})
             MATCH (ru)-[:HAS_ROOM]->(r:Room {uuid: $uuid})
             MATCH (r)-[:HAS_CATEGORY]->(rc:RoomCategory)
             MATCH (r)-[:HAS_FILE_SETTINGS]->(rfs:RoomFileSettings)
             MATCH (r)-[:HAS_USER_SETTINGS]->(rus:RoomUserSettings)
             MATCH (r)-[:HAS_CHANNEL_SETTINGS]->(rcs:RoomChannelSettings)
             MATCH (r)-[:HAS_RULES_SETTINGS]->(rrs:RoomRulesSettings)
             MATCH (r)-[:HAS_JOIN_SETTINGS]->(rjs:RoomJoinSettings)
             MATCH (r)-[:HAS_ROOM_AVATAR]->(ra:RoomAvatar)
             OPTIONAL MATCH (raf:RoomFile)-[:HAS_ROOM]->(r)
             OPTIONAL MATCH (ra)-[:HAS_ROOM_FILE]->(araf:RoomFile)
             RETURN u, ru, r, rc, rfs, rus, rcs, rrs, rjs, ra, araf, raf, sum(raf.size) as bytes_used, sum(raf.size) / 1048576 as mb_used`,
            { user_uuid: user.sub, uuid }
        );

        const m = room.records[0];
        const roomInstance = {
            ...m.get('r').properties,
            bytes_used: m.get('bytes_used').low,
            mb_used: m.get('mb_used').low
        };

        const rel = [
            { roomCategory: m.get('rc').properties },
            { roomUser: m.get('ru').properties },
            { roomFileSettings: m.get('rfs').properties },
            { roomUserSettings: m.get('rus').properties },
            { roomChannelSettings: m.get('rcs').properties },
            { roomRulesSettings: m.get('rrs').properties },
            { roomJoinSettings: m.get('rjs').properties },
        ];

        if (m.get('ra')) rel.push({ roomAvatar: m.get('ra').properties });
        if (m.get('araf')) rel.push({ roomFile: m.get('araf').properties });

        return dto(roomInstance, rel);
    }

    async findAll(options = { user: null, page: null, limit: null }) {
        RoomServiceValidator.findAll(options);

        const { user, page, limit } = options;

        return super.findAll({
            page, limit, override: {
                match: [
                    'MATCH (ru:RoomUser)-[:HAS_USER]->(u:User {uuid: $user_uuid})',
                    'MATCH (ru)-[:HAS_ROOM]->(r:Room)',
                    'MATCH (r)-[:HAS_CATEGORY]->(rc:RoomCategory)',
                    'MATCH (r)-[:HAS_FILE_SETTINGS]->(rfs:RoomFileSettings)',
                    'MATCH (r)-[:HAS_USER_SETTINGS]->(rus:RoomUserSettings)',
                    'MATCH (r)-[:HAS_CHANNEL_SETTINGS]->(rcs:RoomChannelSettings)',
                    'MATCH (r)-[:HAS_RULES_SETTINGS]->(rrs:RoomRulesSettings)',
                    'MATCH (r)-[:HAS_JOIN_SETTINGS]->(rjs:RoomJoinSettings)',
                    'OPTIONAL MATCH (r)-[:HAS_ROOM_AVATAR]->(ra:RoomAvatar)',
                    'OPTIONAL MATCH (ra)-[:HAS_ROOM_FILE]->(raf:RoomFile)'
                ],
                return: ['r', 'ru', 'rc', 'rfs', 'rus', 'rcs', 'rrs', 'rjs', 'ra', 'raf'],
                map: {
                    model: 'r', relationships: [
                        { alias: 'ru', to: 'roomUser' },
                        { alias: 'rc', to: 'roomCategory' },
                        { alias: 'rfs', to: 'roomFileSettings' },
                        { alias: 'rus', to: 'roomUserSettings' },
                        { alias: 'rcs', to: 'roomChannelSettings' },
                        { alias: 'rrs', to: 'roomRulesSettings' },
                        { alias: 'rjs', to: 'roomJoinSettings' },
                        { alias: 'ra', to: 'roomAvatar' },
                        { alias: 'raf', to: 'roomFile' }
                    ]
                },
                params: { user_uuid: user.sub }
            }
        });
    }

    async create(options = { body: null, file: null, user: null }) {
        RoomServiceValidator.create(options);

        const { body, file, user } = options;

        if (!(await RoomPermissionService.isVerified({ user }))) {
            throw new ControllerError(403, 'You must verify your email before you can create a room');
        }

        if (await neodeInstance.model('Room').first('uuid', body.uuid)) {
            throw new ControllerError(400, 'Room with this UUID already exists');
        }

        if (await neodeInstance.model('Room').first('name', body.name)) {
            throw new ControllerError(400, 'Room with this name already exists');
        }

        const roomCategory = await neodeInstance.model('RoomCategory').first('name', body.room_category_name);
        if (!roomCategory) {
            throw new ControllerError(400, 'Room category not found');
        }

        /**
         * Create prerequisite settings
         * and add them to the room
         */
        const roomJoinSettings = await neodeInstance.model('RoomJoinSettings').create({ uuid: uuidv4(), join_message });
        const roomFileSettings = await neodeInstance.model('RoomFileSettings').create({ uuid: uuidv4(), file_days_to_live, total_files_bytes_allowed, single_file_bytes_allowed });
        const roomUserSettings = await neodeInstance.model('RoomUserSettings').create({ uuid: uuidv4(), max_users });
        const roomChannelSettings = await neodeInstance.model('RoomChannelSettings').create({ uuid: uuidv4(), max_channels, message_days_to_live });
        const roomRulesSettings = await neodeInstance.model('RoomRulesSettings').create({ uuid: uuidv4(), rules_text });
        const roomAvatar = await neodeInstance.model('RoomAvatar').create({ uuid: uuidv4() });

        const room = await neodeInstance.model('Room').create({
            uuid: body.uuid,
            name: body.name,
            description: body.description,
        })

        await room.relateTo(roomJoinSettings, 'room_join_settings');
        await room.relateTo(roomFileSettings, 'room_file_settings');
        await room.relateTo(roomUserSettings, 'room_user_settings');
        await room.relateTo(roomChannelSettings, 'room_channel_settings');
        await room.relateTo(roomRulesSettings, 'room_rules_settings');
        await room.relateTo(roomAvatar, 'room_avatar');
        await room.relateTo(roomCategory, 'room_category');

        /**
         * Add the user to the room as an admin
         */
        const userInstance = await neodeInstance.model('User').find(user.sub);
        if (!userInstance) throw new ControllerError(404, 'User not found');

        const roomUserRole = await neodeInstance.model('RoomUserRole').first('name', 'Admin');
        if (!roomUserRole) throw new ControllerError(404, 'RoomUserRole not found');

        const roomUser = await neodeInstance.model('RoomUser').create({ uuid: uuidv4() });
        await roomUser.relateTo(userInstance, 'user');
        await roomUser.relateTo(room, 'room');
        await roomUser.relateTo(roomUserRole, 'room_user_role');

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
            const roomFileType = await neodeInstance.model('RoomFileType').first('name', 'RoomAvatar');
            if (!roomFileType) throw new ControllerError(404, 'RoomFileType not found');

            const roomFile = await neodeInstance.model('RoomFile').create({ uuid: uuidv4(), src, size });
            await roomFile.relateTo(roomFileType, 'room_file_type');
            await roomFile.relateTo(room, 'room');
            await roomAvatar.relateTo(roomFile, 'room_file');
        }

        return this.dto({ ...room.properties(), bytes_used: 0, mb_used: 0 }, [
            { roomCategory: roomCategory.properties() },
            { roomJoinSettings: roomJoinSettings.properties() },
            { roomFileSettings: roomFileSettings.properties() },
            { roomUserSettings: roomUserSettings.properties() },
            { roomChannelSettings: roomChannelSettings.properties() },
            { roomRulesSettings: roomRulesSettings.properties() },
            { roomAvatar: roomAvatar.properties() }
        ]);
    }

    async update(options = { uuid: null, body: null, file: null, user: null }) {
        RoomServiceValidator.update(options);

        const { uuid, body, file, user } = options;
        const { name, description, room_category_name } = body;

        if (!(await RoomPermissionService.isInRoom({ room_uuid: uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        const roomInstance = await neodeInstance.model('Room').find(uuid);
        if (!roomInstance) throw new ControllerError(404, 'Room not found');

        if (name && name !== roomInstance.get('name') &&
            await neodeInstance.model('Room').first('name', name)) {
            throw new ControllerError(400, 'Room with this name already exists');
        }

        const params = {};
        if (name) params.name = name;
        if (description) params.description = description;
        if (Object.keys(params).length > 0) await roomInstance.update(params);

        if (room_category_name) {
            const oldRoomCategoryInstance = await neodeInstance.model('RoomCategory').find(
                roomInstance.get('room_category').endNode().properties().name
            );
            if (!oldRoomCategoryInstance) throw new ControllerError(404, 'Old RoomCategory not found');
            await roomInstance.detachFrom(oldRoomCategoryInstance);

            const roomCategory = await neodeInstance.model('RoomCategory').first('name', room_category_name);
            if (!roomCategory) throw new ControllerError(404, 'New Room category not found');

            await roomInstance.relateTo(roomCategory, 'room_category');
        }

        if (file && file.size > 0) {
            const roomAvatar = roomInstance.get('room_avatar').endNode().properties();
            const roomAvatarInstance = await neodeInstance.model('RoomAvatar').find(roomAvatar.uuid);
            if (!roomAvatarInstance) throw new ControllerError(404, 'RoomAvatar not found');

            const oldRoomFile = roomAvatarInstance.get('room_file')?.endNode()?.properties();

            if (oldRoomFile) {
                const oldRoomFileInstance = await neodeInstance.model('RoomFile').find(oldRoomFile.uuid);
                if (!oldRoomFileInstance) throw new ControllerError(404, 'RoomFile not found');
                roomAvatarInstance.detachFrom(oldRoomFileInstance);
            }
            const size = file.size;
            if ((await RoomPermissionService.fileExceedsTotalFilesLimit({ room_uuid: uuid, bytes: size }))) {
                throw new ControllerError(400, 'The room does not have enough space for this file');
            }
            if ((await RoomPermissionService.fileExceedsSingleFileSize({ room_uuid: uuid, bytes: size }))) {
                throw new ControllerError(400, 'File exceeds single file size limit');
            }
            const src = await storage.uploadFile(file, uuid);
            const roomFileType = await neodeInstance.model('RoomFileType').first('name', 'RoomAvatar');
            if (!roomFileType) throw new ControllerError(404, 'RoomFileType not found');

            const roomFile = await neodeInstance.model('RoomFile').create({ uuid: uuidv4(), src, size });
            await roomFile.relateTo(roomFileType, 'room_file_type');
            await roomFile.relateTo(roomInstance, 'room');
            await roomInstance.relateTo(roomFile, 'room_avatar');


            await roomAvatarInstance.relateTo(roomFile, 'room_file');
        }

        return this.findOne({ uuid, user });
    }

    async destroy(options = { uuid: null, user: null }) {
        RoomServiceValidator.destroy(options);

        const { uuid, user } = options;

        const room = await neodeInstance.model('Room').find(uuid);
        if (!room) throw new ControllerError(404, 'room not found');

        if (!(await RoomPermissionService.isInRoom({ room_uuid: uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        await room.delete();

        console.warn('TODO: DELETE FILES in room_service.js');
    }

    async editSettings(options = { uuid: null, body: null, user: null }) {
        RoomServiceValidator.editSettings(options);

        const { uuid, body, user } = options;
        const { join_message, rules_text, join_channel_uuid } = body;

        if (!(await RoomPermissionService.isInRoom({ room_uuid: uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        const roomInstance = await neodeInstance.cypher(
            `MATCH (r:Room {uuid: $uuid})
             MATCH (r)-[:HAS_JOIN_SETTINGS]->(rjs:RoomJoinSettings)
             MATCH (r)-[:HAS_RULES_SETTINGS]->(rrs:RoomRulesSettings)
             RETURN r, rjs, rrs`,
            { uuid }
        )

        if (!roomInstance.records.length) throw new ControllerError(404, 'Room not found');

        const roomJoinSettings = roomInstance.records[0].get('rjs').properties;
        const roomRulesSettings = roomInstance.records[0].get('rrs').properties;

        if (join_message) {
            if (!join_message.includes('{name}')) {
                throw new ControllerError(400, 'Join message must include {name}');
            }

            const joinSettingsInstance = await neodeInstance.model('RoomJoinSettings').find(roomJoinSettings.uuid);
            if (!joinSettingsInstance) throw new ControllerError(404, 'RoomJoinSettings not found');
            await joinSettingsInstance.update({ join_message });
        }

        if (join_channel_uuid) {
            const channelInstance = await neodeInstance.model('Channel').first('uuid', join_channel_uuid);
            if (!channelInstance) throw new ControllerError(404, 'Channel not found');

            const joinSettingsInstance = await neodeInstance.model('RoomJoinSettings').find(roomJoinSettings.uuid);
            if (!joinSettingsInstance) throw new ControllerError(404, 'RoomJoinSettings not found');
            await joinSettingsInstance.relateTo(channelInstance, 'join_channel');
        }

        if (rules_text) {
            const rulesSettingsInstance = await neodeInstance.model('RoomRulesSettings').find(roomRulesSettings.uuid);
            if (!rulesSettingsInstance) throw new ControllerError(404, 'RoomRulesSettings not found');
            await rulesSettingsInstance.update({ rules_text });
        }
    }

    async leave(options = { uuid: null, user: null }) {
        RoomServiceValidator.leave(options);

        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        if (!(await RoomPermissionService.isInRoom({ room_uuid: uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        const dbResult = await neodeInstance.cypher(
            `MATCH (ru:RoomUser)-[:HAS_USER]->(u:User {uuid: $user_uuid})
             MATCH (ru)-[:HAS_ROOM]->(r:Room {uuid: $uuid})
             MATCH (ru)-[:HAS_ROLE]->(rur:RoomUserRole)
             RETURN ru, r, rur`,
            { user_uuid, uuid }
        );

        if (!dbResult.records.length) throw new ControllerError(404, 'Room User not found');

        const roomUser = dbResult.records[0].get('ru').properties;
        const roomUserInstance = await neodeInstance.model('RoomUser').find(roomUser.uuid);

        await roomUserInstance.delete();
    }
};

const service = new RoomService();

export default service;
