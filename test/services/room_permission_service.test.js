import RelationalRoomPermissionService from '../../src/relational-based/services/room_permission_service.js';
import RelationalRoomService from '../../src/relational-based/services/room_service.js';

import DocumentRoomPermissionService from '../../src/document-based/services/room_permission_service.js';
import DocumentRoomService from '../../src/document-based/services/room_service.js';

import GraphRoomPermissionService from '../../src/graph-based/services/room_permission_service.js';
import GraphRoomService from '../../src/graph-based/services/room_service.js';

import data from '../../src/seed_data.js';
import { test, expect } from 'vitest';

const roomPermissionServiceTest = (RoomPermissionService, RoomService, name) => {
    const user = { sub: data.users.find(u => u.username === 'not_in_a_room').uuid };
    const admin = { sub: data.users[0].uuid };
    const mod = { sub: data.users[1].uuid };
    const member = { sub: data.users[2].uuid };
    const room_uuid = data.rooms[0].uuid;
    const channel_uuid = data.rooms[0].channels[0].uuid;

    test(`(${name}) - RoomPermissionService must implement expected methods`, () => {
        expect(RoomPermissionService).toHaveProperty('isVerified');
        expect(RoomPermissionService).toHaveProperty('isInRoom');
        expect(RoomPermissionService).toHaveProperty('isInRoomByChannel');
        expect(RoomPermissionService).toHaveProperty('fileExceedsTotalFilesLimit');
        expect(RoomPermissionService).toHaveProperty('fileExceedsSingleFileSize');
        expect(RoomPermissionService).toHaveProperty('roomUserCountExceedsLimit');
        expect(RoomPermissionService).toHaveProperty('channelCountExceedsLimit');
    });

    test.each([
        [{ user: admin, role_name: 'Admin' }, true],
        [{ user: admin, role_name: 'Moderator' }, false],
        [{ user: admin, role_name: 'Member' }, false],
        [{ user: mod, role_name: 'Moderator' }, true],
        [{ user: mod, role_name: 'Admin' }, false],
        [{ user: mod, role_name: 'Member' }, false],
        [{ user: member, role_name: 'Member' }, true],
        [{ user: member, role_name: 'Moderator' }, false],
        [{ user: member, role_name: 'Admin' }, false],
        [{ user: admin, role_name: null }, true],
        [{ user: mod, role_name: null }, true],
        [{ user: member, role_name: null }, true],
        [{ user, role_name: 'Admin' }, false],
        [{ user, role_name: 'Moderator' }, false],
        [{ user, role_name: 'Member' }, false],
        [{ user, role_name: null }, false],
    ])(`(${name}) - RoomPermissionService.isInRoom valid partitions`, async (options, expected) => {
        expect(await RoomPermissionService.isInRoom({...options, room_uuid})).toBe(expected);
    });

    test.each([
        [null, 'Invalid options provided'],
        ["", 'Invalid options provided'],
        [1, 'Invalid options provided'],
        [0, 'Invalid options provided'],
        [[], 'Invalid options provided'],
        [{}, 'No options.room_uuid provided'],
        [{ room_uuid: "test" }, 'No options.user provided'],
        [{ room_uuid: "test", user: { } }, 'No options.user.sub provided'],
    ])(`(${name}) - RoomPermissionService.isInRoom invalid partitions`, async (options, expected) => {
        expect(async () => await RoomPermissionService.isInRoom(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ user: admin, role_name: 'Admin' }, true],
        [{ user: admin, role_name: 'Moderator' }, false],
        [{ user: admin, role_name: 'Member' }, false],
        [{ user: mod, role_name: 'Moderator' }, true],
        [{ user: mod, role_name: 'Admin' }, false],
        [{ user: mod, role_name: 'Member' }, false],
        [{ user: member, role_name: 'Member' }, true],
        [{ user: member, role_name: 'Moderator' }, false],
        [{ user: member, role_name: 'Admin' }, false],
        [{ user: admin, role_name: null }, true],
        [{ user: mod, role_name: null }, true],
        [{ user: member, role_name: null }, true],
        [{ user, role_name: 'Admin' }, false],
        [{ user, role_name: 'Moderator' }, false],
        [{ user, role_name: 'Member' }, false],
        [{ user, role_name: null }, false],
    ])(`(${name}) - RoomPermissionService.isInRoomByChannel valid partitions`, async (options, expected) => {
        expect(await RoomPermissionService.isInRoomByChannel({...options, channel_uuid})).toBe(expected);
    });

    test.each([
        [null, 'Invalid options provided'],
        ["", 'Invalid options provided'],
        [1, 'Invalid options provided'],
        [0, 'Invalid options provided'],
        [[], 'Invalid options provided'],
        [{}, 'No options.channel_uuid provided'],
        [{ channel_uuid: "test" }, 'No options.user provided'],
        [{ channel_uuid: "test", user: { } }, 'No options.user.sub provided'],
    ])(`(${name}) - RoomPermissionService.isInRoomByChannel invalid partitions`, async (options, expected) => {
        expect(async () => await RoomPermissionService.isInRoomByChannel(options)).rejects.toThrowError(expected);
    });

    test(`(${name}) - RoomPermissionService.fileExceedsTotalFilesLimit valid partitions`, async () => {
        const room = await RoomService.findOne({ uuid: room_uuid, user: admin });
        const { total_files_bytes_allowed } = room.fileSettings;
        
        expect(await RoomPermissionService.fileExceedsTotalFilesLimit(
            { room_uuid, bytes: 1 }
        )).toBe(false);
        expect(await RoomPermissionService.fileExceedsTotalFilesLimit(
            { room_uuid, bytes: ( total_files_bytes_allowed + 1 ) }
        )).toBe(true);
    });

    test.each([
        [null, 'Invalid options provided'],
        ["", 'Invalid options provided'],
        [1, 'Invalid options provided'],
        [0, 'Invalid options provided'],
        [[], 'Invalid options provided'],
        [{}, 'No options.room_uuid provided'],
        [{ room_uuid: "test" }, 'No options.bytes provided'],
    ])(`(${name}) - RoomPermissionService.fileExceedsTotalFilesLimit invalid partitions`, async (options, expected) => {
        expect(async () => await RoomPermissionService.fileExceedsTotalFilesLimit(options)).rejects.toThrowError(expected);
    });

    test(`(${name}) - RoomPermissionService.fileExceedsSingleFileSize valid partitions`, async () => {
        const room = await RoomService.findOne({ uuid: room_uuid, user: admin });
        const { single_file_bytes_allowed } = room.fileSettings;
        
        expect(await RoomPermissionService.fileExceedsSingleFileSize(
            { room_uuid, bytes: 1 }
        )).toBe(false);
        expect(await RoomPermissionService.fileExceedsSingleFileSize(
            { room_uuid, bytes: ( single_file_bytes_allowed + 1 ) }
        )).toBe(true);
    });

    test.each([
        [null, 'Invalid options provided'],
        ["", 'Invalid options provided'],
        [1, 'Invalid options provided'],
        [0, 'Invalid options provided'],
        [[], 'Invalid options provided'],
        [{}, 'No options.room_uuid provided'],
        [{ room_uuid: "test" }, 'No options.bytes provided'],
    ])(`(${name}) - RoomPermissionService.fileExceedsSingleFileSize invalid partitions`, async (options, expected) => {
        expect(async () => await RoomPermissionService.fileExceedsSingleFileSize(options)).rejects.toThrowError(expected);
    });

    test(`(${name}) - RoomPermissionService.roomUserCountExceedsLimit valid partitions`, async () => {
        const room = await RoomService.findOne({ uuid: room_uuid, user: admin });
        const { max_users } = room.userSettings;

        expect(await RoomPermissionService.roomUserCountExceedsLimit(
            { room_uuid, add_count: 1 }
        )).toBe(false);
        expect(await RoomPermissionService.roomUserCountExceedsLimit(
            { room_uuid, add_count: ( max_users + 1 ) }
        )).toBe(true);
    });

    test.each([
        [null, 'Invalid options provided'],
        ["", 'Invalid options provided'],
        [1, 'Invalid options provided'],
        [0, 'Invalid options provided'],
        [[], 'Invalid options provided'],
        [{}, 'No options.room_uuid provided'],
        [{ room_uuid: "test" }, 'No options.add_count provided'],
    ])(`(${name}) - RoomPermissionService.roomUserCountExceedsLimit invalid partitions`, async (options, expected) => {
        expect(async () => await RoomPermissionService.roomUserCountExceedsLimit(options)).rejects.toThrowError(expected);
    });

    test(`(${name}) - RoomPermissionService.channelCountExceedsLimit valid partitions`, async () => {
        const room = await RoomService.findOne({ uuid: room_uuid, user: admin });
        const { max_channels } = room.channelSettings;

        expect(await RoomPermissionService.channelCountExceedsLimit(
            { room_uuid, add_count: 1 }
        )).toBe(false);
        expect(await RoomPermissionService.channelCountExceedsLimit(
            { room_uuid, add_count: ( max_channels + 1 ) }
        )).toBe(true);
    });

    test.each([
        [null, 'Invalid options provided'],
        ["", 'Invalid options provided'],
        [1, 'Invalid options provided'],
        [0, 'Invalid options provided'],
        [[], 'Invalid options provided'],
        [{}, 'No options.room_uuid provided'],
        [{ room_uuid: "test" }, 'No options.add_count provided'],
    ])(`(${name}) - RoomPermissionService.channelCountExceedsLimit invalid partitions`, async (options, expected) => {
        expect(async () => await RoomPermissionService.channelCountExceedsLimit(options)).rejects.toThrowError(expected);
    });
};

roomPermissionServiceTest(RelationalRoomPermissionService, RelationalRoomService, 'Relational');
// roomPermissionServiceTest(DocumentRoomPermissionService, DocumentRoomService, 'Document');
// roomPermissionServiceTest(GraphRoomPermissionService, GraphRoomService, 'Graph');
