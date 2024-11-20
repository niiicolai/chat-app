import RelationalUserService from '../../src/relational-based/services/user_service.js';
import RelationalRoomService from '../../src/relational-based/services/room_service.js';

import DocumentUserService from '../../src/document-based/services/user_service.js';
import DocumentRoomService from '../../src/document-based/services/room_service.js';

import GraphUserService from '../../src/graph-based/services/user_service.js';
import GraphRoomService from '../../src/graph-based/services/room_service.js';

import { test, expect, beforeAll } from 'vitest';
import { context } from '../context.js';
import { v4 as uuidv4 } from 'uuid';

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

const roomServiceTest = (RoomService, UserService, name) => {
    const admin_room_uuid = uuidv4();
    const mod_room_uuid = uuidv4();
    const member_room_uuid = uuidv4();
    const user = { 
        uuid: uuidv4(),
        username: `test-${uuidv4()}`,
        email: `test-${uuidv4()}@example.com`,
        password: '12345678',
    };

    beforeAll(async () => {
        await UserService.create({ body: user });
    });

    test(`(${name}) - RoomService must implement expected methods`, () => {
        expect(RoomService).toHaveProperty('findOne');
        expect(RoomService).toHaveProperty('findAll');
        expect(RoomService).toHaveProperty('create');
        expect(RoomService).toHaveProperty('update');
        expect(RoomService).toHaveProperty('editSettings');
        expect(RoomService).toHaveProperty('destroy');
    });

    test.each([
        [{ uuid: context.room.uuid, user: context.admin }],
        [{ uuid: context.room.uuid, user: context.mod }],
        [{ uuid: context.room.uuid, user: context.member }],
    ])(`(${name}) - RoomService.findOne valid partitions`, async (options) => {
        isValidRoom(await RoomService.findOne(options));
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
        expect(() => RoomService.findOne(options)).rejects.toThrowError(expected);
    });
   
    test.each([
        [{ user: context.admin }],
        [{ user: context.mod }],
        [{ user: context.member }],
        [{ user: context.admin, limit: 1 }],
        [{ user: context.mod, limit: 1 }],
        [{ user: context.member, limit: 1 }],
        [{ user: context.admin, page: 1, limit: 1 }],
        [{ user: context.mod, page: 1, limit: 1 }],
        [{ user: context.member, page: 1, limit: 1 }],
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
        [{ user: context.admin, page: 1 }, 'page requires limit'],
        [{ user: context.admin, page: -1 }, 'page must be greater than 0'],
        [{ user: context.admin, page: "test" }, 'page must be a number'],
        [{ user: context.admin, page: 1, limit: -1 }, 'limit must be greater than 0'],
        [{ user: context.admin, page: 1, limit: "test" }, 'limit must be a number'],
    ])(`(${name}) - RoomService.findAll invalid partitions`, async (options, expected) => {
        expect(() => RoomService.findAll(options)).rejects.toThrowError(expected);
    });
    
    test.each([
        [{ user: context.admin, body: { uuid: admin_room_uuid, name: `test-${uuidv4()}`, description: 'test', room_category_name: 'General' } }],
        [{ user: context.mod, body: { uuid: mod_room_uuid, name: `test-${uuidv4()}`, description: 'test', room_category_name: 'General' } }],
        [{ user: context.member, body: { uuid: member_room_uuid, name: `test-${uuidv4()}`, description: 'test', room_category_name: 'General' } }],
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
        [{ body: { } }, 'No user provided'],
        [{ body: { }, user: "test" }, 'No uuid provided'],
        [{ body: { }, user: { } }, 'No user.sub provided'],
        [{ body: { }, user: { sub: "test" } }, 'No uuid provided'],
        [{ body: { uuid: "test" }, user: { sub: "test" } }, 'No name provided'],
        [{ body: { uuid: "test", name: "test" }, user: { sub: "test" } }, 'No description provided'],
        [
            { body: { uuid: "test", name: "test", description: "test" }, user: { sub: "test" } }, 
            'No room_category_name provided'
        ],
    ])(`(${name}) - RoomService.create invalid partitions`, async (options, expected) => {
        expect(() => RoomService.create(options)).rejects.toThrowError(expected);
    });
 
    test.each([
        [{ user: context.admin, uuid: admin_room_uuid, body: { name: `test-${uuidv4()}`, description: 'test', room_category_name: 'General' } }],
        [{ user: context.mod, uuid: mod_room_uuid, body: { name: `test-${uuidv4()}`, description: 'test', room_category_name: 'General' } }],
        [{ user: context.member, uuid: member_room_uuid, body: { name: `test-${uuidv4()}`, description: 'test', room_category_name: 'General' } }],
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
        [{ body: { } }, 'No uuid provided'],
        [{ body: { }, uuid: "test" }, 'No user provided'],
        [{ body: { }, uuid: "test", user: { } }, 'No user.sub provided'],
    ])(`(${name}) - RoomService.update invalid partitions`, async (options, expected) => {
        expect(() => RoomService.update(options)).rejects.toThrowError(expected);
    });
    
    test.each([
        [{ user: context.admin, uuid: admin_room_uuid, body: { join_message: `{name}-updated`, rules_text: 'updated' } }],
        [{ user: context.mod, uuid: mod_room_uuid, body: { join_message: `{name}-updated`, rules_text: 'updated' } }],
        [{ user: context.member, uuid: member_room_uuid, body: { join_message: `{name}-updated`, rules_text: 'updated' } }],
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
        [{ body: { } }, 'No uuid provided'],
        [{ uuid: "test" }, 'No body provided'],
        [{ uuid: "test", body: { } }, 'No user provided'],
        [{ uuid: "test", body: { }, user: { } }, 'No user.sub provided'],
    ])(`(${name}) - RoomService.editSettings invalid partitions`, async (options, expected) => {
        expect(() => RoomService.editSettings(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ user: context.admin, uuid: admin_room_uuid }],
        [{ user: context.mod, uuid: mod_room_uuid }],
        [{ user: context.member, uuid: member_room_uuid }],
    ])(`(${name}) - RoomService.destroy valid partitions`, async (options) => {
        await RoomService.destroy(options);
        expect(() => RoomService.findOne({ uuid: options.uuid, user: options.user }))
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
        [{ uuid: "test", user: { } }, 'No user.sub provided'],
        [{ uuid: "test", user: { sub: "test" } }, 'room not found'],
    ])(`(${name}) - RoomService.destroy invalid partitions`, async (options, expected) => {
        expect(() => RoomService.destroy(options)).rejects.toThrowError(expected);
    });

    /**
     * Security Checks
     */

    test(`(${name}) - RoomService.findOne return error for users who are not members`, async () => {
        expect(() => RoomService.findOne({ uuid: context.room.uuid, user: { sub: user.uuid } }))
            .rejects.toThrowError("User is not in the room");
    });

    test.each([
        [context.mod.sub],
        [context.member.sub],
        [user.uuid],
    ])(`(${name}) - RoomService.update return error for users who are not admin`, async (sub) => {
        expect(() => RoomService.update({ uuid: context.room.uuid, user: { sub }, body: { description: "test" } }))
            .rejects.toThrowError(/User is not an admin of the room|User is not in the room/);
    });

    test.each([
        [context.mod.sub],
        [context.member.sub],
        [user.uuid],
    ])(`(${name}) - RoomService.destroy returns an error for users who are not admin`, async (sub) => {
        await expect(RoomService.destroy({ uuid: context.room.uuid, user: { sub } }))
            .rejects
            .toThrow(/User is not an admin of the room|User is not in the room/);
    });

    test.each([
        [context.mod.sub],
        [context.member.sub],
        [user.uuid],
    ])(`(${name}) - RoomService.editSettings returns an error for users who are not admin`, async (sub) => {
        await expect(RoomService.editSettings({ uuid: context.room.uuid, user: { sub }, body: {} }))
            .rejects
            .toThrow(/User is not an admin of the room|User is not in the room/);
    });
};

roomServiceTest(RelationalRoomService, RelationalUserService, 'Relational');
roomServiceTest(DocumentRoomService, DocumentUserService, 'Document');
roomServiceTest(GraphRoomService, GraphUserService, 'Graph');
