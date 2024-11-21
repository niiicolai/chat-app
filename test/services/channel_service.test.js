import RelationalChannelService from '../../src/relational-based/services/channel_service.js';
import RelationalRoomService from '../../src/relational-based/services/room_service.js';
import RelationalUserService from '../../src/relational-based/services/user_service.js';

import DocumentChannelService from '../../src/document-based/services/channel_service.js';
import DocumentRoomService from '../../src/document-based/services/room_service.js';
import DocumentUserService from '../../src/document-based/services/user_service.js';

import GraphChannelService from '../../src/graph-based/services/channel_service.js';
import GraphRoomService from '../../src/graph-based/services/room_service.js';
import GraphUserService from '../../src/graph-based/services/user_service.js';

import { context } from '../context.js';
import { test, expect, beforeAll, afterAll } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

const channelTest = (ChannelService, RoomService, UserService, name) => {
    const room_uuid = uuidv4();
    const channel_uuid = uuidv4();
    const user = { 
        uuid: uuidv4(),
        username: `test-${uuidv4()}`,
        email: `test-${uuidv4()}@example.com`,
        password: '12345678',
    };

    beforeAll(async () => {
        await RoomService.create({ 
            user: context.admin,
            body: { 
                uuid: room_uuid, 
                name: `test-${uuidv4()}`, 
                description: "Test Room Description", 
                room_category_name: "General" 
            }
        });
        await UserService.create({ 
            user: context.admin, 
            body: user 
        });
    });

    afterAll(async () => {
        await RoomService.destroy({ uuid: room_uuid, user: context.admin });
    });

    test(`(${name}) - ChannelService must implement expected methods`, () => {
        expect(ChannelService).toHaveProperty('findOne');
        expect(ChannelService).toHaveProperty('findAll');
        expect(ChannelService).toHaveProperty('create');
        expect(ChannelService).toHaveProperty('update');
        expect(ChannelService).toHaveProperty('destroy');
    });

    test.each([
        [{ uuid: context.channel.uuid, user: context.admin }],
    ])(`(${name}) - ChannelService.findOne valid partitions`, async (options) => {
        const result = await ChannelService.findOne(options);

        expect(result).toHaveProperty('uuid');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('description');
        expect(result).toHaveProperty('channel_type_name');
        expect(result).toHaveProperty('room_uuid');
        expect(result).toHaveProperty('created_at');
        expect(result).toHaveProperty('updated_at');
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{}, 'No uuid provided'],
        [{ uuid: '' }, 'No uuid provided'],
        [{ uuid: "test" }, 'No user provided'],
        [{ uuid: "test", user: { } }, 'No user.sub provided'],
        [{ uuid: "test", user: { sub: "test" } }, 'channel not found'],
    ])(`(${name}) - ChannelService.findOne invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelService.findOne(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ room_uuid: context.room.uuid, user: context.admin }],
        [{ room_uuid: context.room.uuid, user: context.mod }],
        [{ room_uuid: context.room.uuid, user: context.member }],
    ])(`(${name}) - ChannelService.findAll valid partitions`, async (options) => {
        const result = await ChannelService.findAll(options);

        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('data');

        expect(result.total).toBeGreaterThan(0);
        expect(result.data[0]).toHaveProperty('uuid');
        expect(result.data[0]).toHaveProperty('name');
        expect(result.data[0]).toHaveProperty('description');
        expect(result.data[0]).toHaveProperty('channel_type_name');
        expect(result.data[0]).toHaveProperty('room_uuid');
        expect(result.data[0]).toHaveProperty('created_at');
        expect(result.data[0]).toHaveProperty('updated_at');

        if (options?.page) {
            expect(result).toHaveProperty('pages');
            expect(result).toHaveProperty('page');
            expect(result).toHaveProperty('limit');
        }
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No room_uuid provided'],
        [0, 'No options provided'],
        [[], 'No room_uuid provided'],
        [{}, 'No room_uuid provided'],
        [{ room_uuid: '' }, 'No room_uuid provided'],
        [{ room_uuid: 'test' }, 'No user provided'],
        [{ room_uuid: 'test', user: {} }, 'No user.sub provided'],
        [{ room_uuid: 'test', user: { sub: "test" } }, 'User is not in the room'],
    ])(`(${name}) - ChannelService.findAll invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelService.findAll(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ 
            user: context.admin, 
            body: { 
                uuid: channel_uuid, 
                room_uuid, 
                name: `test-${uuidv4()}`,
                description: "test", 
                channel_type_name: "Text"
            } 
        }],
    ])(`(${name}) - ChannelService.create valid partitions`, async (options) => {
        const result = await ChannelService.create(options);

        expect(result).toHaveProperty('uuid');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('description');
        expect(result).toHaveProperty('channel_type_name');
        expect(result).toHaveProperty('room_uuid');
        expect(result).toHaveProperty('created_at');
        expect(result).toHaveProperty('updated_at');
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No body provided'],
        [0, 'No options provided'],
        [[], 'No body provided'],
        [{}, 'No body provided'],
        [{ body: { } }, 'No user provided'],
        [{ body: { }, user: { } }, 'No user.sub provided'],
        [{ body: { }, user: { sub: "test" } }, 'No uuid provided'],
    ])(`(${name}) - ChannelService.create invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelService.create(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ 
            user: context.admin,
            uuid: channel_uuid,
            body: { 
                name: `test-${uuidv4()}`,
                description: "test", 
                channel_type_name: "Text"
            } 
        }],
    ])(`(${name}) - ChannelService.update valid partitions`, async (options) => {
        const result = await ChannelService.update(options);

        expect(result).toHaveProperty('uuid');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('description');
        expect(result).toHaveProperty('channel_type_name');
        expect(result).toHaveProperty('room_uuid');
        expect(result).toHaveProperty('created_at');
        expect(result).toHaveProperty('updated_at');
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{}, 'No uuid provided'],
        [{ uuid: { } }, 'No user provided'],
        [{ uuid: "test", user: { } }, 'No user.sub provided'],
        [{ uuid: "test", user: { sub: "test" } }, 'No body provided'],
    ])(`(${name}) - ChannelService.update invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelService.update(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ 
            user: context.admin,
            uuid: channel_uuid,
        }],
    ])(`(${name}) - ChannelService.destroy valid partitions`, async (options) => {
        await ChannelService.destroy(options);
        expect(async () => await ChannelService.findOne(options))
            .rejects.toThrowError('channel not found');
    });

    /**
     * Security Checks
     */

    test.each([
        [context.mod.sub],
        [context.member.sub],
        [user.uuid],
    ])(`(${name}) - ChannelService.create return error for users who are not admin`, async (sub) => {
        expect(async () => await ChannelService.create({ user: { sub }, body: { uuid: uuidv4(), room_uuid: context.room.uuid, name: "test", description: "test", channel_type_name: "Text" } }))
            .rejects.toThrowError("User is not an admin of the room");
    });

    test.each([
        [context.mod.sub],
        [context.member.sub],
        [user.uuid],
    ])(`(${name}) - ChannelService.destroy return error for users who are not admin`, async (sub) => {
        expect(async () => await ChannelService.destroy({ user: { sub }, uuid: context.channel.uuid }))
            .rejects.toThrowError(/User is not an admin of the room|User is not in the room/);
    });

    test.each([
        [context.mod.sub],
        [context.member.sub],
        [user.uuid],
    ])(`(${name}) - ChannelService.update return error for users who are not admin`, async (sub) => {
        expect(async () => await ChannelService.update({ user: { sub }, uuid: context.channel.uuid, body: { description: "test" } }))
            .rejects.toThrow(/User is not an admin of the room|User is not in the room/);
    });
    
    test.each([
        [user.uuid],
    ])(`(${name}) - ChannelService.findOne return error for users who are not member`, async (sub) => {
        expect(async () => await ChannelService.findOne({ user: { sub }, uuid: context.channel.uuid }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [user.uuid],
    ])(`(${name}) - ChannelService.findAll return error for users who are not member`, async (sub) => {
        expect(async () => await ChannelService.findAll({ user: { sub }, room_uuid: context.room.uuid }))
            .rejects.toThrow("User is not in the room");
    });
};

channelTest(
    RelationalChannelService, 
    RelationalRoomService, 
    RelationalUserService,
    'Relational'
);

channelTest(
    DocumentChannelService, 
    DocumentRoomService,
    DocumentUserService, 
    'Document'
);

channelTest(
    GraphChannelService, 
    GraphRoomService,
    GraphUserService, 
    'Graph'
);
