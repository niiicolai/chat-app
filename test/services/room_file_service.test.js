import RelationalRoomFileService from '../../src/relational-based/services/room_file_service.js';
import RelationalUserService from '../../src/relational-based/services/user_service.js';

import DocumentRoomFileService from '../../src/document-based/services/room_file_service.js';
import DocumentUserService from '../../src/document-based/services/user_service.js';

import GraphRoomFileService from '../../src/graph-based/services/room_file_service.js';
import GraphUserService from '../../src/graph-based/services/user_service.js';

import { context } from '../context.js';
import { test, expect, beforeAll } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

const roomFileServiceTest = (RoomFileService, UserService, name) => {
    const user = { 
        uuid: uuidv4(),
        username: `test-${uuidv4()}`,
        email: `test-${uuidv4()}@example.com`,
        password: '12345678',
    };

    beforeAll(async () => {
        await UserService.create({ body: user });
    });

    test(`(${name}) - RoomFileService must implement expected methods`, () => {
        expect(RoomFileService).toHaveProperty('findOne');
        expect(RoomFileService).toHaveProperty('findAll');
        expect(RoomFileService).toHaveProperty('destroy');
        expect(RoomFileService).toHaveProperty('isOwner');
    });

    test.each([
        [{ room_uuid: context.room.uuid, user: context.admin, limit: 2 }],
        [{ room_uuid: context.room.uuid, user: context.mod, limit: 1 }],
        [{ room_uuid: context.room.uuid, user: context.member, limit: 1, page: 1 }],
    ])(`(${name}) - RoomFileService.findAll valid partitions`, async (options) => {
        const result = await RoomFileService.findAll(options);

        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('data');

        expect(result.data[0]).toHaveProperty('uuid');
        expect(result.data[0]).toHaveProperty('room_file_type_name');
        expect(result.data[0]).toHaveProperty('room_uuid');
        expect(result.data[0]).toHaveProperty('size');
        expect(result.data[0]).toHaveProperty('size_mb');
        expect(result.data[0]).toHaveProperty('src');
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
        [{ page: 1 }, 'No room_uuid provided'],
        [{ room_uuid: "test" }, 'No user provided'],
        [{ room_uuid: "test", user: {}, page: 1 }, 'No user.sub provided'],
        [{ room_uuid: "test", user: { sub: "test" }, page: 1 }, 'page requires limit'],
        [{ room_uuid: "test", user: { sub: "test" }, page: -1 }, 'page must be greater than 0'],
        [{ room_uuid: "test", user: { sub: "test" }, page: "test" }, 'page must be a number'],
        [{ room_uuid: "test", user: { sub: "test" }, page: 1, limit: -1 }, 'limit must be greater than 0'],
        [{ room_uuid: "test", user: { sub: "test" }, page: 1, limit: "test" }, 'limit must be a number'],
    ])(`(${name}) - RoomFileService.findAll invalid partitions`, async (options, expected) => {
        expect(async () => await RoomFileService.findAll(options)).rejects.toThrowError(expected);
    });

    test(`(${name}) - RoomFileService.findOne valid partitions`, async () => {
        const files = await RoomFileService.findAll({ room_uuid: context.room.uuid, user: context.admin, limit: 1 });
        expect(files.data.length).toBeGreaterThan(0);
        const result = await RoomFileService.findOne({ uuid: files.data[0].uuid, user: context.admin });

        expect(result).toHaveProperty('uuid');
        expect(result).toHaveProperty('room_file_type_name');
        expect(result).toHaveProperty('room_uuid');
        expect(result).toHaveProperty('size');
        expect(result).toHaveProperty('size_mb');
        expect(result).toHaveProperty('src');
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
        [{ uuid: "test" }, 'No user provided'],
        [{ uuid: "test", user: { } }, 'No user.sub provided'],
        [{ uuid: "test", user: { sub: "test" } }, 'room_file not found'],
    ])(`(${name}) - RoomFileService.findOne invalid partitions`, async (options, expected) => {
        expect(async () => await RoomFileService.findOne(options)).rejects.toThrowError(expected);
    });

    /**
     * Security Checks
     */

    test.each([
        [user.uuid],
    ])(`(${name}) - RoomFileService.findOne return error for users who are not member`, async (sub) => {
        const files = await RoomFileService.findAll({ room_uuid: context.room.uuid, user: context.admin, limit: 1 });
        expect(async () => await RoomFileService.findOne({ user: { sub }, uuid: files.data[0].uuid }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [user.uuid],
    ])(`(${name}) - RoomFileService.findAll return error for users who are not member`, async (sub) => {
        expect(async () => await RoomFileService.findAll({ room_uuid: context.room.uuid, user: { sub } }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [context.member.sub],
        [user.uuid],
    ])(`(${name}) - RoomFileService.destroy return error for users who are not admin or moderator`, async (sub) => {
        const { data } = await RoomFileService.findAll({ room_uuid: context.room.uuid, user: context.admin, limit: 2 });
        expect(async () => await RoomFileService.destroy({ uuid: data[0].uuid, user: { sub } }))
            .rejects.toThrow(/User is not an owner of the file, or an admin or moderator of the room|User is not in the room/);
    });
};

roomFileServiceTest(
    RelationalRoomFileService,
    RelationalUserService, 
    'Relational'
);

roomFileServiceTest(
    DocumentRoomFileService,
    DocumentUserService,
    'Document'
);

roomFileServiceTest(
    GraphRoomFileService,
    GraphUserService, 
    'Graph'
);
