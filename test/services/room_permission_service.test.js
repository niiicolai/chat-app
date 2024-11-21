import RelationalUserService from '../../src/relational-based/services/user_service.js';
import RelationalRoomPermissionService from '../../src/relational-based/services/room_permission_service.js';
import RelationalRoomInviteLinkService from '../../src/relational-based/services/room_invite_link_service.js';
import RelationalRoomService from '../../src/relational-based/services/room_service.js';
import RelationalRoomUserService from '../../src/relational-based/services/room_user_service.js';
import RelationalChannelService from '../../src/relational-based/services/channel_service.js';

import DocumentUserService from '../../src/document-based/services/user_service.js';
import DocumentRoomPermissionService from '../../src/document-based/services/room_permission_service.js';
import DocumentRoomInviteLinkService from '../../src/document-based/services/room_invite_link_service.js';
import DocumentRoomService from '../../src/document-based/services/room_service.js';
import DocumentRoomUserService from '../../src/document-based/services/room_user_service.js';
import DocumentChannelService from '../../src/document-based/services/channel_service.js';

import GraphUserService from '../../src/graph-based/services/user_service.js';
import GraphRoomPermissionService from '../../src/graph-based/services/room_permission_service.js';
import GraphRoomInviteLinkService from '../../src/graph-based/services/room_invite_link_service.js';
import GraphRoomService from '../../src/graph-based/services/room_service.js';
import GraphRoomUserService from '../../src/graph-based/services/room_user_service.js';
import GraphChannelService from '../../src/graph-based/services/channel_service.js';

import { test, expect, beforeAll } from 'vitest';
import { context } from '../context.js';
import { v4 as uuidv4 } from 'uuid';

const roomPermissionServiceTest = (
    RoomPermissionService, 
    UserService, 
    RoomInviteLinkService, 
    RoomService, 
    ChannelService,
    RoomUserService,
    name) => {

    const room_uuid = uuidv4();
    const channel_uuid = uuidv4();
    const room_invite_link_uuid = uuidv4();
    const user = { 
        uuid: uuidv4(),
        username: `test-${uuidv4()}`,
        email: `test-${uuidv4()}@example.com`,
        password: '12345678',
    };

    beforeAll(async () => {
        await UserService.create({ body: user });
        await RoomService.create({ 
            user: context.admin, 
            body: { 
                uuid: room_uuid, 
                name: `test-${uuidv4()}`, 
                description: 'test', 
                room_category_name: 'General' 
            } 
        });
        await ChannelService.create({
            user: context.admin,
            body: {
                uuid: channel_uuid,
                name: `test-${uuidv4()}`,
                description: 'test',
                channel_type_name: 'Text',
                room_uuid,
            }
        });
        await RoomInviteLinkService.create({ 
            user: context.admin,
            body: { 
                uuid: room_invite_link_uuid, 
                room_uuid,
            }
        });
        await RoomInviteLinkService.join({ user: context.mod, uuid: room_invite_link_uuid });
        await RoomInviteLinkService.join({ user: context.member, uuid: room_invite_link_uuid });
        
        const modRoomUser = await RoomUserService.findAuthenticatedUser({ room_uuid, user: context.mod });
        await RoomUserService.update({ user: context.admin, uuid: modRoomUser.uuid, body: { room_user_role_name: 'Moderator' } });
    });

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
        [{ user: context.admin, role_name: 'Admin' }, true],
        [{ user: context.admin, role_name: 'Moderator' }, false],
        [{ user: context.admin, role_name: 'Member' }, false],
        [{ user: context.mod, role_name: 'Moderator' }, true],
        [{ user: context.mod, role_name: 'Admin' }, false],
        [{ user: context.mod, role_name: 'Member' }, false],
        [{ user: context.member, role_name: 'Member' }, true],
        [{ user: context.member, role_name: 'Moderator' }, false],
        [{ user: context.member, role_name: 'Admin' }, false],
        [{ user: context.admin, role_name: null }, true],
        [{ user: context.mod, role_name: null }, true],
        [{ user: context.member, role_name: null }, true],
        [{ user: { sub: user.uuid }, role_name: 'Admin' }, false],
        [{ user: { sub: user.uuid }, role_name: 'Moderator' }, false],
        [{ user: { sub: user.uuid }, role_name: 'Member' }, false],
        [{ user: { sub: user.uuid }, role_name: null }, false],
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
        [{ user: context.admin, role_name: 'Admin' }, true],
        [{ user: context.admin, role_name: 'Moderator' }, false],
        [{ user: context.admin, role_name: 'Member' }, false],
        [{ user: context.mod, role_name: 'Moderator' }, true],
        [{ user: context.mod, role_name: 'Admin' }, false],
        [{ user: context.mod, role_name: 'Member' }, false],
        [{ user: context.member, role_name: 'Member' }, true],
        [{ user: context.member, role_name: 'Moderator' }, false],
        [{ user: context.member, role_name: 'Admin' }, false],
        [{ user: context.admin, role_name: null }, true],
        [{ user: context.mod, role_name: null }, true],
        [{ user: context.member, role_name: null }, true],
        [{ user: { sub: user.uuid }, role_name: 'Admin' }, false],
        [{ user: { sub: user.uuid }, role_name: 'Moderator' }, false],
        [{ user: { sub: user.uuid }, role_name: 'Member' }, false],
        [{ user: { sub: user.uuid }, role_name: null }, false],
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
        const room = await RoomService.findOne({ uuid: room_uuid, user: context.admin });
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
        const room = await RoomService.findOne({ uuid: room_uuid, user: context.admin });
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
        const room = await RoomService.findOne({ uuid: room_uuid, user: context.admin });
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
        const room = await RoomService.findOne({ uuid: room_uuid, user: context.admin });
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

roomPermissionServiceTest(
    RelationalRoomPermissionService, 
    RelationalUserService, 
    RelationalRoomInviteLinkService, 
    RelationalRoomService, 
    RelationalChannelService,
    RelationalRoomUserService, 
    'Relational'
);

roomPermissionServiceTest(
    DocumentRoomPermissionService, 
    DocumentUserService, 
    DocumentRoomInviteLinkService, 
    DocumentRoomService, 
    DocumentChannelService,
    DocumentRoomUserService, 
    'Document'
);

roomPermissionServiceTest(
    GraphRoomPermissionService, 
    GraphUserService, 
    GraphRoomInviteLinkService, 
    GraphRoomService, 
    GraphChannelService,
    GraphRoomUserService, 
    'Graph'
);
