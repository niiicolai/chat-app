import Validator from '../../shared/validators/room_service_validator.js';
import err from '../../shared/errors/index.js';
import StorageService from '../../shared/services/storage_service.js';
import RPS from './room_permission_service.js';
import neodeInstance from '../neode/index.js';
import dto from '../dto/room_dto.js';
import neo4j from 'neo4j-driver';
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
 * @description Service class for rooms
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

        const { user, uuid } = options;

        const room = await neodeInstance.model('Room').find(uuid);
        if (!room) throw new err.EntityNotFoundError('room');

        const isInRoom = await RPS.isInRoom({ room_uuid: uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        const roomCategory = room.get('room_category').endNode().properties();
        const roomFileSettings = room.get('room_file_settings').endNode().properties();
        const roomUserSettings = room.get('room_user_settings').endNode().properties();
        const roomChannelSettings = room.get('room_channel_settings').endNode().properties();
        const roomRulesSettings = room.get('room_rules_settings').endNode().properties();
        const roomJoinSettings = room.get('room_join_settings').endNode().properties();
        const roomAvatar = room.get('room_avatar').endNode().properties();
        const roomFile = room.get('room_avatar').get('room_file')?.endNode()?.properties();

        return dto({
            ...room.properties(),
            roomCategory,
            roomFileSettings,
            roomUserSettings,
            roomChannelSettings,
            roomRulesSettings,
            roomJoinSettings,
            roomAvatar,
            roomFile
        });
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

        const result = await neodeInstance.cypher(
            `MATCH (u:User {uuid: $user_uuid})-[ru:MEMBER_IN]->(r:Room) ` +
            `MATCH (r)-[:CATEGORY_IS]->(rc:RoomCategory) ` +
            `MATCH (r)-[:FILE_SETTINGS_IS]->(rfs:RoomFileSettings) ` +
            `MATCH (r)-[:USER_SETTINGS_IS]->(rus:RoomUserSettings) ` +
            `MATCH (r)-[:CHANNEL_SETTINGS_IS]->(rcs:RoomChannelSettings) ` +
            `MATCH (r)-[:RULES_SETTINGS_IS]->(rrs:RoomRulesSettings) ` +
            `MATCH (r)-[:JOIN_SETTINGS_IS]->(rjs:RoomJoinSettings) ` +
            `MATCH (r)-[:ROOM_AVATAR_IS]->(ra:RoomAvatar) ` +
            `ORDER BY r.created_at DESC ` +
            (offset ? `SKIP $offset ` : ``) +
            (limit ? `LIMIT $limit ` : ``) +
            `RETURN r, rc, rfs, rus, rcs, rrs, rjs, ra, COUNT(r) AS total`,
            {
                ...(offset && { offset: neo4j.int(offset) }),
                ...(limit && { limit: neo4j.int(limit) }),
                user_uuid: user.sub
            }
        );

        const total = result.records.length ?
            result.records[0].get('total').low
            : 0;
            
        return {
            total,
            data: result.records.map(record => dto({
                ...record.get('r').properties,
                roomCategory: record.get('rc').properties,
                roomFileSettings: record.get('rfs').properties,
                roomUserSettings: record.get('rus').properties,
                roomChannelSettings: record.get('rcs').properties,
                roomRulesSettings: record.get('rrs').properties,
                roomJoinSettings: record.get('rjs').properties,
                roomAvatar: record.get('ra').properties
            })),
            ...(limit && { limit }),
            ...(page && limit && { page, pages: Math.ceil(total / limit) }),
        };
    }

    /**
     * @function create
     * @description Create a room
     * @param {Object} options
     * @param {Object} options.body
     * @param {Object} options.body.uuid
     * @param {Object} options.body.name
     * @param {Object} options.body.description
     * @param {Object} options.body.room_category_name
     * @param {Object} options.file
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async create(options = { body: null, file: null, user: null }) {
        Validator.create(options);

        const { body, file, user } = options;
        const { uuid, name, description, room_category_name } = body;

        const isVerified = await RPS.isVerified({ user });
        if (!isVerified) throw new err.VerifiedEmailRequiredError("create a room");

        const uuidInUse = await neodeInstance.model('Room').find(uuid);
        if (uuidInUse) throw new err.DuplicateEntryError('room', 'PRIMARY', uuid);

        const nameInUse = await neodeInstance.model('Room').first('name', name);
        if (nameInUse) throw new err.DuplicateEntryError('room', 'room_name', name);

        const validCategory = await neodeInstance.model('RoomCategory').find(room_category_name);
        if (!validCategory) throw new err.EntityNotFoundError('room_category_name');

        let room_file_src = null;
        if (file && file.size > 0) {
            if (file.size > parseFloat(process.env.ROOM_TOTAL_UPLOAD_SIZE)) {
                throw new err.ExceedsRoomTotalFilesLimitError();
            }
            if (file.size > parseFloat(process.env.ROOM_UPLOAD_SIZE)) {
                throw new err.ExceedsSingleFileSizeError();
            }

            room_file_src = await storage.uploadFile(file, uuid);
        }

        const session = neodeInstance.session();
        await session.writeTransaction(async tx => {
            // Create Room
            await tx.run(
                `MATCH (rc:RoomCategory {name: $room_category_name}) ` +
                `CREATE (r:Room {uuid: $uuid, name: $name, description: $description, created_at: datetime(), updated_at: datetime()}) ` +
                `CREATE (r)-[:CATEGORY_IS]->(rc) `,
                { uuid, name, description, room_category_name }
            );

            // Add user to room as admin
            await tx.run(
                `MATCH (r:Room {uuid: $uuid}) ` +
                `MATCH (u:User {uuid: $user_uuid}) ` +
                `CREATE (u)-[:MEMBER_IN {uuid: $mui_uuid, role: "Admin", created_at: datetime(), updated_at: datetime()}]->(r) `,
                { uuid, user_uuid: user.sub, mui_uuid: uuidv4() }
            );

            // Add settings and avatar
            await tx.run(
                `MATCH (r:Room {uuid: $uuid}) ` +
                `CREATE (r)-[:FILE_SETTINGS_IS]->(rfs:RoomFileSettings {uuid: $fsi_uuid, file_days_to_live: $file_days_to_live, total_files_bytes_allowed: $total_files_bytes_allowed, single_file_bytes_allowed: $single_file_bytes_allowed}) ` +
                `CREATE (r)-[:USER_SETTINGS_IS]->(rus:RoomUserSettings {uuid: $usi_uuid, max_users: $max_users}) ` +
                `CREATE (r)-[:CHANNEL_SETTINGS_IS]->(rcs:RoomChannelSettings {uuid: $csi_uuid, max_channels: $max_channels, message_days_to_live: $message_days_to_live}) ` +
                `CREATE (r)-[:RULES_SETTINGS_IS]->(rrs:RoomRulesSettings {uuid: $rsi_uuid, rules_text: $rules_text}) ` +
                `CREATE (r)-[:JOIN_SETTINGS_IS]->(rjs:RoomJoinSettings {uuid: $jsi_uuid, join_message: $join_message}) ` +
                `CREATE (r)-[:ROOM_AVATAR_IS]->(ra:RoomAvatar {uuid: $rai_uuid})`,
                {
                    uuid,
                    fsi_uuid: uuidv4(),
                    usi_uuid: uuidv4(),
                    csi_uuid: uuidv4(),
                    rsi_uuid: uuidv4(),
                    jsi_uuid: uuidv4(),
                    rai_uuid: uuidv4(),
                    file_days_to_live,
                    total_files_bytes_allowed,
                    single_file_bytes_allowed,
                    max_users,
                    max_channels,
                    message_days_to_live,
                    rules_text,
                    join_message
                }
            );

            // Add avatar file
            if (room_file_src) {
                // Add new file
                await tx.run(
                    `MATCH (r:Room {uuid: $uuid})-[:ROOM_AVATAR_IS]->(ra:RoomAvatar) ` +
                    `MATCH (rft:RoomFileType {name: 'RoomAvatar'}) ` +
                    `CREATE (rf:RoomFile {uuid: $rfi_uuid, src: $src, size: $size, created_at: datetime(), updated_at: datetime()}) ` +
                    `CREATE (ra)-[:ROOM_AVATAR_IS]->(rf) ` +
                    `CREATE (rf)-[:STORED_IN]->(r) ` +
                    `CREATE (rf)-[:TYPE_IS]->(rft) `,
                    { uuid, rfi_uuid: uuidv4(), src: room_file_src, size: file.size }
                );
            }

        }).catch(error => {
            // Delete the avatar file if it was uploaded
            if (room_file_src) storage.deleteFile(storage.parseKey(room_file_src));

            console.error('transaction', error);
            throw error;
        }).finally(() => {
            session.close();
        });

        return this.findOne({ uuid, user });
    }

    /**
     * @function update
     * @description Update a room
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.body
     * @param {Object} options.body.name optional
     * @param {Object} options.body.description optional
     * @param {Object} options.body.room_category_name optional
     * @param {Object} options.file optional
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<Object>}
     */
    async update(options = { uuid: null, body: null, file: null, user: null }) {
        Validator.update(options);

        const { uuid, body, file, user } = options;
        const { name, description, room_category_name } = body;

        const room = await neodeInstance.model('Room').find(uuid);
        if (!room) throw new err.EntityNotFoundError('room');

        const isAdmin = await RPS.isInRoom({ room_uuid: uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        if (name && name !== room.get('name') &&
            await neodeInstance.model('Room').first('name', name)) {
            throw new err.DuplicateEntryError('room', 'room_name', name);
        }

        const currentCategory = room.get('room_category').endNode().properties().name;
        if (room_category_name && room_category_name !== currentCategory) {
            const validCategory = await neodeInstance.model('RoomCategory').first('name', room_category_name);
            if (!validCategory) throw new err.EntityNotFoundError('room_category_name');
        }

        let room_file_src = null;
        if (file && file.size > 0) {
            const [exceedsTotal, exceedsSingle] = await Promise.all([
                RPS.fileExceedsTotalFilesLimit({ room_uuid: uuid, bytes: file.size }),
                RPS.fileExceedsSingleFileSize({ room_uuid: uuid, bytes: file.size }),
            ]);
            if (exceedsTotal) throw new err.ExceedsRoomTotalFilesLimitError();
            if (exceedsSingle) throw new err.ExceedsSingleFileSizeError();

            room_file_src = await storage.uploadFile(file, uuid);
        }

        const session = neodeInstance.session();
        await session.writeTransaction(async tx => {
            // Update Room
            if (name || description) {
                await tx.run(
                    `MATCH (r:Room {uuid: $uuid}) ` +
                    `SET r.updated_at = datetime() ` +
                    (name ? `SET r.name = $name ` : ``) +
                    (description ? `SET r.description = $description ` : ``),
                    { uuid, name, description }
                );
            }

            // Update Room Category
            if (room_category_name && room_category_name !== currentCategory) {
                await tx.run(
                    `MATCH (r:Room {uuid: $uuid}) ` +
                    `MATCH (r)-[oc:CATEGORY_IS]->(rc:RoomCategory {name: $current_category_name}) ` +
                    `MATCH (rc_new:RoomCategory {name: $room_category_name}) ` +
                    `DELETE oc ` +
                    `CREATE (r)-[:CATEGORY_IS]->(rc_new) `,
                    { uuid, current_category_name: currentCategory, room_category_name }
                );
            }

            // Update Room Avatar
            // Add avatar file
            if (room_file_src) {
                // Remove old file if any
                await tx.run(
                    `MATCH (r:Room {uuid: $uuid})-[:ROOM_AVATAR_IS]->(ra:RoomAvatar)-[:ROOM_AVATAR_IS]->(rf:RoomFile) ` +
                    `DETACH DELETE rf`,
                    { uuid }
                );
                
                // Add new file
                await tx.run(
                    `MATCH (r:Room {uuid: $uuid})-[:ROOM_AVATAR_IS]->(ra:RoomAvatar) ` +
                    `MATCH (rft:RoomFileType {name: 'RoomAvatar'}) ` +
                    `CREATE (rf:RoomFile {uuid: $rfi_uuid, src: $src, size: $size, created_at: datetime(), updated_at: datetime()}) ` +
                    `CREATE (ra)-[:ROOM_AVATAR_IS]->(rf) ` +
                    `CREATE (rf)-[:STORED_IN]->(r) ` +
                    `CREATE (rf)-[:TYPE_IS]->(rft) `,
                    { uuid, rfi_uuid: uuidv4(), src: room_file_src, size: file.size }
                );
            }

        }).catch(error => {
            // Delete the avatar file if it was uploaded
            if (room_file_src) storage.deleteFile(storage.parseKey(room_file_src));
            console.error('transaction', error);
            throw error;
        }).finally(() => {
            session.close();
        });

        return this.findOne({ uuid, user });
    }

    /**
     * @function destroy
     * @description Destroy a room
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<void>}
     */
    async destroy(options = { uuid: null, user: null }) {
        Validator.destroy(options);

        const { uuid, user } = options;

        const room = await neodeInstance.model('Room').find(uuid);
        if (!room) throw new err.EntityNotFoundError('room');

        const isAdmin = await RPS.isInRoom({ room_uuid: uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        const session = neodeInstance.session();
        await session.writeTransaction(async tx => {
            // Check if room has avatar
            const avatar = await tx.run(
                `MATCH (r:Room {uuid: $uuid})-[:ROOM_AVATAR_IS]->(ra:RoomAvatar)-[:ROOM_AVATAR_IS]->(rf:RoomFile) ` +
                `RETURN rf.src AS src`,
                { uuid }
            );

            // Delete room and related nodes
            await tx.run(
                `MATCH (r:Room {uuid: $uuid}) ` +
                `MATCH (r)-[:FILE_SETTINGS_IS]->(rfs:RoomFileSettings) ` +
                `MATCH (r)-[:USER_SETTINGS_IS]->(rus:RoomUserSettings) ` +
                `MATCH (r)-[:CHANNEL_SETTINGS_IS]->(rcs:RoomChannelSettings) ` +
                `MATCH (r)-[:RULES_SETTINGS_IS]->(rrs:RoomRulesSettings) ` +
                `MATCH (r)-[:JOIN_SETTINGS_IS]->(rjs:RoomJoinSettings) ` +
                `MATCH (r)-[:ROOM_AVATAR_IS]->(ra:RoomAvatar) ` +
                `OPTIONAL MATCH (r)-[:COMMUNICATES_IN]->(c:Channel) ` +
                `OPTIONAL MATCH (cm:ChannelMessage)-[:WRITTEN_IN]->(c) ` +
                `OPTIONAL MATCH (rf)-[:STORED_IN]->(r) ` +
                `DETACH DELETE r, rfs, rus, rcs, rrs, rjs, ra, c, cm, rf`,
                { uuid }
            );
            
            // Delete avatar file if any
            if (avatar.records.length) {
                const src = avatar.records[0].get('src');
                await storage.deleteFile(storage.parseKey(src));
            }
            
        }).catch(error => {
            console.error('transaction', error);
            throw error;
        }).finally(() => {
            session.close();
        });
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

        const room = await neodeInstance.model('Room').find(uuid);
        if (!room) throw new err.EntityNotFoundError('room');

        const isAdmin = await RPS.isInRoom({ room_uuid: uuid, user, role_name: 'Admin' });
        if (!isAdmin) throw new err.AdminPermissionRequiredError();

        if (join_channel_uuid) {
            const channel = await neodeInstance.model('Channel').find(join_channel_uuid);
            if (!channel) throw new err.EntityNotFoundError('join_channel_uuid');
        }

        if (join_message && !join_message.includes('{name}')) {
            throw new err.ControllerError(400, 'Join message must include {name}');
        }

        const session = neodeInstance.session();
        await session.writeTransaction(async tx => {
            if (rules_text) {
                await tx.run(
                    `MATCH (r:Room {uuid: $uuid})-[:RULES_SETTINGS_IS]->(rrs:RoomRulesSettings) ` +
                    `SET rrs.rules_text = $rules_text`,
                    { uuid, rules_text }
                );
            }

            if (join_message) {
                if (!join_message.includes('{name}')) {
                    throw new err.InvalidJoinMessageError();
                }

                await tx.run(
                    `MATCH (r:Room {uuid: $uuid})-[:JOIN_SETTINGS_IS]->(rjs:RoomJoinSettings) ` +
                    `SET rjs.join_message = $join_message`,
                    { uuid, join_message }
                );
            }

            if (join_channel_uuid) {
                await tx.run(
                    `MATCH (r:Room {uuid: $uuid}) ` +
                    `MATCH (c:Channel {uuid: $join_channel_uuid}) ` +
                    `MATCH (r)-[:JOIN_SETTINGS_IS]->(rjs:RoomJoinSettings) ` +
                    `CREATE (rjs)-[:ANNOUNCE_IN]->(c)`,
                    { uuid, join_channel_uuid }
                );
            }
            
        }).catch(error => {
            console.error('transaction', error);
            throw error;
        }).finally(() => {
            session.close();
        });
    }

    /**
     * @function leave
     * @description Leave a room
     * @param {Object} options
     * @param {String} options.uuid
     * @param {Object} options.user
     * @param {String} options.user.sub
     * @returns {Promise<void>}
     */
    async leave(options = { uuid: null, user: null }) {
        Validator.leave(options);

        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        const room = await neodeInstance.model('Room').find(uuid);
        if (!room) throw new err.EntityNotFoundError('room');

        const isInRoom = await RPS.isInRoom({ room_uuid: uuid, user });
        if (!isInRoom) throw new err.RoomMemberRequiredError();

        await neodeInstance.batch([
            `MATCH (u:User {uuid: $user_uuid})-[:MEMBER_IN]->(r:Room {uuid: $uuid}) ` +
            `DETACH u`,
            { user_uuid, uuid }
        ]);
    }
};

const service = new RoomService();

export default service;
