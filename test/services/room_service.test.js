import RelationalRoomService from '../../src/relational-based/services/room_service.js';
import DocumentRoomService from '../../src/document-based/services/room_service.js';
import GraphRoomService from '../../src/graph-based/services/room_service.js';

import data from '../../src/seed_data.js';
import { test, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

const roomServiceTest = (RoomService, name) => {

    /**
     * Exisiting entities
     */

    const user = { sub: data.users.find(u => u.username === 'not_in_a_room').uuid };
    const admin = { sub: data.users[0].uuid };
    const mod = { sub: data.users[1].uuid };
    const member = { sub: data.users[2].uuid };
    const room_uuid = data.rooms[0].uuid;
    const room_name = data.rooms[1].name;
    const admin_room_uuid = uuidv4();
    const mod_room_uuid = uuidv4();
    const member_room_uuid = uuidv4();


    /**
     * Expected Methods
     */

    test(`(${name}) - RoomService must implement expected methods`, () => {
        expect(RoomService).toHaveProperty('findOne');
        expect(RoomService).toHaveProperty('findAll');
        expect(RoomService).toHaveProperty('create');
        expect(RoomService).toHaveProperty('update');
        expect(RoomService).toHaveProperty('editSettings');
        expect(RoomService).toHaveProperty('leave');
        expect(RoomService).toHaveProperty('destroy');
    });


    /**
     * RoomService.findOne
     */

    test.each([
        [{ uuid: room_uuid, user: admin }],
        [{ uuid: room_uuid, user: mod }],
        [{ uuid: room_uuid, user: member }],
    ])(`(${name}) - RoomService.findOne valid partitions`, async (options) => {
        const room = await RoomService.findOne(options);

        isValidRoom(room);
    });

    test.each([
        [undefined, 'No uuid provided'],
        [null, 'No options provided'],
        [{}, 'No uuid provided'],
        [[], 'No uuid provided'],
        [{ email: null }, 'No uuid provided'],
        [{ test: null }, 'No uuid provided'],
        [{ uuid: "test" }, 'No user provided'],
        [{ uuid: "test", user: null }, 'No user provided'],
        [{ uuid: "test", user: {} }, 'No user.sub provided'],
        [{ uuid: "test", user: { sub: null } }, 'No user.sub provided'],
        [{ uuid: "test", user: { sub: "test" } }, 'room not found'],
    ])(`(${name}) - RoomService.findOne invalid partitions`, async (options, expected) => {
        expect(async () => await RoomService.findOne(options)).rejects.toThrowError(expected);
    });



    /**
     * RoomService.findAll
     */

    test.each([
        [{ user: admin }],
        [{ user: mod }],
        [{ user: member }],
        [{ user: admin, limit: 1 }],
        [{ user: mod, limit: 1 }],
        [{ user: member, limit: 1 }],
        [{ user: admin, page: 1, limit: 1 }],
        [{ user: mod, page: 1, limit: 1 }],
        [{ user: member, page: 1, limit: 1 }],
    ])(`(${name}) - RoomService.findAll valid partitions`, async (options) => {
        const result = await RoomService.findAll(options);

        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('data');

        isValidRoom(result.data[0]);

        if (options?.page) {
            expect(result).toHaveProperty('pages');
            expect(result).toHaveProperty('page');
            expect(result).toHaveProperty('limit');
        }
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No user provided'],
        [0, 'No options provided'],
        [[], 'No user provided'],
        [{ page: 1 }, 'No user provided'],
        [{ user: admin, page: 1 }, 'page requires limit'],
        [{ user: admin, page: -1 }, 'page must be greater than 0'],
        [{ user: admin, page: "test" }, 'page must be a number'],
        [{ user: admin, page: 1, limit: -1 }, 'limit must be greater than 0'],
        [{ user: admin, page: 1, limit: "test" }, 'limit must be a number'],
    ])(`(${name}) - RoomService.findAll invalid partitions`, async (options, expected) => {
        expect(async () => await RoomService.findAll(options)).rejects.toThrowError(expected);
    });



    /**
     * RoomService.create
     */

    test.each([
        [{ user: admin, body: { uuid: admin_room_uuid, name: `test-${uuidv4()}`, description: 'test', room_category_name: 'General' } }],
        [{ user: mod, body: { uuid: mod_room_uuid, name: `test-${uuidv4()}`, description: 'test', room_category_name: 'General' } }],
        [{ user: member, body: { uuid: member_room_uuid, name: `test-${uuidv4()}`, description: 'test', room_category_name: 'General' } }],
    ])(`(${name}) - RoomService.create valid partitions`, async (options) => {
        const room = await RoomService.create(options);
        isValidRoom(room);
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No body provided'],
        [0, 'No options provided'],
        [[], 'No body provided'],
        [{}, 'No body provided'],
        [{ body: {} }, 'No user provided'],
        [{ body: {}, user: "test" }, 'No uuid provided'],
        [{ body: {}, user: {} }, 'No user.sub provided'],
        [{ body: {}, user: { sub: "test" } }, 'No uuid provided'],
        [{ body: { uuid: "test" }, user: { sub: "test" } }, 'No name provided'],
        [{ body: { uuid: "test", name: "test" }, user: { sub: "test" } }, 'No description provided'],
        [
            { body: { uuid: "test", name: "test", description: "test" }, user: { sub: "test" } },
            'No room_category_name provided'
        ],
        [
            { body: { uuid: "test", name: "test", description: "test", room_category_name: "test" }, user: { sub: "test" } },
            'You must verify your email before you can create a room'
        ],
        [
            { body: { uuid: "test", name: "test", description: "test", room_category_name: "test" }, user: admin },
            'room_category_name not found'
        ],
        [
            { body: { uuid: "test", name: room_name, description: "test", room_category_name: "General" }, user: admin },
            `room with room_name ${room_name} already exists`
        ],
        [
            { body: { uuid: room_uuid, name: "test", description: "test", room_category_name: "General" }, user: admin },
            `room with PRIMARY ${room_uuid} already exists`
        ],
    ])(`(${name}) - RoomService.create invalid partitions`, async (options, expected) => {
        expect(async () => await RoomService.create(options)).rejects.toThrowError(expected);
    });



    /**
     * RoomService.update
     */

    test.each([
        [{ user: admin, uuid: admin_room_uuid, body: { name: `test-${uuidv4()}`, description: 'test', room_category_name: 'General' } }],
        [{ user: mod, uuid: mod_room_uuid, body: { name: `test-${uuidv4()}`, description: 'test', room_category_name: 'General' } }],
        [{ user: member, uuid: member_room_uuid, body: { name: `test-${uuidv4()}`, description: 'test', room_category_name: 'General' } }],
    ])(`(${name}) - RoomService.update valid partitions`, async (options) => {
        const room = await RoomService.update(options);
        isValidRoom(room);
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{}, 'No uuid provided'],
        [{ body: {} }, 'No uuid provided'],
        [{ body: {}, uuid: "test" }, 'No user provided'],
        [{ body: {}, uuid: "test", user: {} }, 'No user.sub provided'],
        [{ body: {}, uuid: "test", user: { sub: "test" } }, 'room not found'],
        [{ body: { name: room_name }, uuid: room_uuid, user: admin }, `room with room_name ${room_name} already exists`],
        [{ body: { room_category_name: "test" }, uuid: room_uuid, user: admin }, `room_category_name not found`],
    ])(`(${name}) - RoomService.update invalid partitions`, async (options, expected) => {
        expect(async () => await RoomService.update(options)).rejects.toThrowError(expected);
    });



    /**
     * RoomService.editSettings
     */

    test.each([
        [{ user: admin, uuid: admin_room_uuid, body: { join_message: `{name}-updated`, rules_text: 'updated' } }],
        [{ user: mod, uuid: mod_room_uuid, body: { join_message: `{name}-updated`, rules_text: 'updated' } }],
        [{ user: member, uuid: member_room_uuid, body: { join_message: `{name}-updated`, rules_text: 'updated' } }],
    ])(`(${name}) - RoomService.editSettings valid partitions`, async (options) => {
        await RoomService.editSettings(options);

        const room = await RoomService.findOne({ uuid: options.uuid, user: options.user });
        expect(room.joinSettings.join_message).toBe(options.body.join_message);
        expect(room.rulesSettings.rules_text).toBe(options.body.rules_text);
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{}, 'No uuid provided'],
        [{ body: {} }, 'No uuid provided'],
        [{ uuid: "test" }, 'No body provided'],
        [{ uuid: "test", body: {} }, 'No user provided'],
        [{ uuid: "test", body: {}, user: {} }, 'No user.sub provided'],
        [{ uuid: "test", body: {}, user: { sub: "test" } }, 'room not found'],
        [{ uuid: room_uuid, body: { join_channel_uuid: "test" }, user: admin }, 'join_channel_uuid not found'],
        [{ uuid: room_uuid, body: { join_message: "test" }, user: admin }, 'Join message must include {name}'],
    ])(`(${name}) - RoomService.editSettings invalid partitions`, async (options, expected) => {
        expect(async () => await RoomService.editSettings(options)).rejects.toThrowError(expected);
    });



    /**
     * RoomService.destroy
     */

    test.each([
        [{ user: admin, uuid: admin_room_uuid }],
        [{ user: mod, uuid: mod_room_uuid }],
        [{ user: member, uuid: member_room_uuid }],
    ])(`(${name}) - RoomService.destroy valid partitions`, async (options) => {
        await RoomService.destroy(options);
        expect(async () => await RoomService.findOne({ uuid: options.uuid, user: options.user }))
            .rejects.toThrowError('room not found');
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{}, 'No uuid provided'],
        [{ uuid: "test" }, 'No user provided'],
        [{ uuid: "test", user: {} }, 'No user.sub provided'],
        [{ uuid: "test", user: { sub: "test" } }, 'room not found'],
    ])(`(${name}) - RoomService.destroy invalid partitions`, async (options, expected) => {
        expect(async () => await RoomService.destroy(options)).rejects.toThrowError(expected);
    });



    /**
     * Security Checks
     */

    test(`(${name}) - RoomService.findOne return error for users who are not members`, async () => {
        expect(async () => await RoomService.findOne({ uuid: room_uuid, user }))
            .rejects.toThrowError("User is not in the room");
    });

    test.each([
        [mod],
        [member],
        [user],
    ])(`(${name}) - RoomService.update return error for users who are not admin`, async (user) => {
        expect(async () => await RoomService.update({ uuid: room_uuid, user, body: { description: "test" } }))
            .rejects.toThrowError("User is not an admin of the room");
    });

    test.each([
        [mod],
        [member],
        [user],
    ])(`(${name}) - RoomService.destroy returns an error for users who are not admin`, async (user) => {
        expect(async () => await RoomService.destroy({ uuid: room_uuid, user }))
            .rejects.toThrow("User is not an admin of the room");
    });

    test.each([
        [mod],
        [member],
        [user],
    ])(`(${name}) - RoomService.editSettings returns an error for users who are not admin`, async (user) => {
        expect(async () => await RoomService.editSettings({ uuid: room_uuid, user, body: {} }))
            .rejects.toThrow("User is not an admin of the room");
    });
};

const isValidRoom = (room) => {
    expect(room).toHaveProperty('uuid');
    expect(room).toHaveProperty('name');
    expect(room).toHaveProperty('description');
    expect(room).toHaveProperty('created_at');
    expect(room).toHaveProperty('updated_at');
    expect(room).toHaveProperty('bytes_used');
    expect(room).toHaveProperty('mb_used');
    expect(room).toHaveProperty('room_category_name');

    expect(room).toHaveProperty('avatar');
    expect(room.avatar).toHaveProperty('uuid');
    expect(room.avatar).toHaveProperty('room_uuid');

    expect(room).toHaveProperty('channelSettings');
    expect(room.channelSettings).toHaveProperty('max_channels');
    expect(room.channelSettings).toHaveProperty('message_days_to_live');

    expect(room).toHaveProperty('fileSettings');
    expect(room.fileSettings).toHaveProperty('file_days_to_live');
    expect(room.fileSettings).toHaveProperty('single_file_bytes_allowed');
    expect(room.fileSettings).toHaveProperty('single_file_mb');
    expect(room.fileSettings).toHaveProperty('total_files_bytes_allowed');
    expect(room.fileSettings).toHaveProperty('total_files_mb');

    expect(room).toHaveProperty('rulesSettings');
    expect(room.rulesSettings).toHaveProperty('rules_text');

    expect(room).toHaveProperty('userSettings');
    expect(room.userSettings).toHaveProperty('max_users');

    expect(room).toHaveProperty('joinSettings');
    expect(room.joinSettings).toHaveProperty('join_message');
    expect(room.joinSettings).toHaveProperty('join_channel_uuid');
};

roomServiceTest(RelationalRoomService, 'Relational');
//roomServiceTest(DocumentRoomService, 'Document');
//roomServiceTest(GraphRoomService, 'Graph');
