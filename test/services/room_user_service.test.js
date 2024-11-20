import RelationalUserService from '../../src/relational-based/services/user_service.js';
import RelationalRoomInviteLinkService from '../../src/relational-based/services/room_invite_link_service.js';
import RelationalRoomUserService from '../../src/relational-based/services/room_user_service.js';

import DocumentUserService from '../../src/document-based/services/user_service.js';
import DocumentRoomInviteLinkService from '../../src/document-based/services/room_invite_link_service.js';
import DocumentRoomUserService from '../../src/document-based/services/room_user_service.js';

import GraphUserService from '../../src/graph-based/services/user_service.js';
import GraphRoomInviteLinkService from '../../src/graph-based/services/room_invite_link_service.js';
import GraphRoomUserService from '../../src/graph-based/services/room_user_service.js';

import { test, beforeAll, expect } from 'vitest';
import { context } from '../context.js';
import { v4 as uuidv4 } from 'uuid';

const isValidRoomUser = (roomUser) => {
    expect(roomUser).toHaveProperty('uuid');
    expect(roomUser).toHaveProperty('room_uuid');
    expect(roomUser).toHaveProperty('user_uuid');
    expect(roomUser).toHaveProperty('room_user_role_name');
    expect(roomUser).toHaveProperty('created_at');
    expect(roomUser).toHaveProperty('updated_at');
};

const roomUserServiceTest = (RoomUserService, RoomInviteLinkService, UserService, name) => {
    const room_invite_link_uuid = uuidv4();
    const user = { 
        uuid: uuidv4(),
        username: `test-${uuidv4()}`,
        email: `test-${uuidv4()}@example.com`,
        password: '12345678',
    };

    beforeAll(async () => {
        await RoomInviteLinkService.create({
            user: context.admin,
            body: { 
                uuid: room_invite_link_uuid,
                room_uuid: context.room.uuid,
            }         
        });
        await UserService.create({ body: user });
    });

    test(`(${name}) - RoomUserService must implement expected methods`, () => {
        expect(RoomUserService).toHaveProperty('findAuthenticatedUser');
    });

    test.each([
        [{ room_uuid: context.room.uuid, user: context.admin }],
        [{ room_uuid: context.room.uuid, user: context.mod }],
        [{ room_uuid: context.room.uuid, user: context.member }],
    ])(`(${name}) - RoomUserService.findAuthenticatedUser valid partitions`, async (options) => {
        isValidRoomUser(await RoomUserService.findAuthenticatedUser(options));
    });

    test.each([
        [ undefined, 'No room_uuid provided' ],
        [ null, 'No options provided' ],
        [ { room_uuid: null }, 'No room_uuid provided' ],
        [ { room_uuid: context.room.uuid }, 'No user provided' ],
        [ { room_uuid: context.room.uuid, user: null }, 'No user provided' ],
        [ { room_uuid: context.room.uuid, user: { sub: null } }, 'No user.sub provided' ],
    ])(`(${name}) - RoomUserService.findAuthenticatedUser invalid partitions`, async (options, expected) => {
        expect(() => RoomUserService.findAuthenticatedUser(options)).rejects.toThrow(expected);
    });

    test.each([
        [{ room_uuid: context.room.uuid, user: context.admin }],
        [{ room_uuid: context.room.uuid, user: context.mod }],
        [{ room_uuid: context.room.uuid, user: context.member }],
    ])(`(${name}) - RoomUserService.findOne valid partitions`, async (options) => {
        const roomUser = await RoomUserService.findAuthenticatedUser(options);
        isValidRoomUser(await RoomUserService.findOne({ uuid: roomUser.uuid, user: options.user }));
    });

    test.each([
        [ undefined, 'No uuid provided' ],
        [ null, 'No options provided' ],
        [ { uuid: null }, 'No uuid provided' ],
        [ { uuid: context.room.uuid }, 'No user provided' ],
        [ { uuid: context.room.uuid, user: null }, 'No user provided' ],
        [ { uuid: context.room.uuid, user: { sub: null } }, 'No user.sub provided' ],
    ])(`(${name}) - RoomUserService.findAuthenticatedUser invalid partitions`, async (options, expected) => {
        expect(() => RoomUserService.findOne(options)).rejects.toThrow(expected);
    });

    test.each([
        [{ room_uuid: context.room.uuid, user: context.admin }],
        [{ room_uuid: context.room.uuid, user: context.mod }],
        [{ room_uuid: context.room.uuid, user: context.member }],
        [{ room_uuid: context.room.uuid, user: context.admin, limit: 1 }],
        [{ room_uuid: context.room.uuid, user: context.mod, limit: 1 }],
        [{ room_uuid: context.room.uuid, user: context.member, limit: 1 }],
        [{ room_uuid: context.room.uuid, user: context.admin, page: 1, limit: 1 }],
        [{ room_uuid: context.room.uuid, user: context.mod, page: 1, limit: 1 }],
        [{ room_uuid: context.room.uuid, user: context.member, page: 1, limit: 1 }],
    ])(`(${name}) - RoomUserService.findAll valid partitions`, async (options) => {
        const result = await RoomUserService.findAll(options);

        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('data');

        isValidRoomUser(result.data[0]);

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
        [{ }, 'No room_uuid provided'],
        [{ room_uuid: "test" }, 'No user provided'],
        [{ room_uuid: "test", user: { } }, 'No user.sub provided'],
        [{ room_uuid: "test", user: { sub: "test" }, page: -1 }, 'page must be greater than 0'],
        [{ room_uuid: "test", user: { sub: "test" }, page: 1 }, 'page requires limit'],
        [{ room_uuid: "test", user: { sub: "test" }, page: 1, limit: -1 }, 'limit must be greater than 0'],
    ])(`(${name}) - RoomUserService.findAll invalid partitions`, async (options, expected) => {
        expect(() => RoomUserService.findAll(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ 
            room_uuid: context.room.uuid, 
            user: context.mod, 
            acting_user: context.admin, 
            new_room_user_role_name: 'Admin',
            old_room_user_role_name: 'Moderator'
        }],
    ])(`(${name}) - RoomUserService.update valid partitions`, async (options) => {
        // Find the room user and update it as the acting user
        const roomUser = await RoomUserService.findAuthenticatedUser({ room_uuid: options.room_uuid, user: options.user });
        await RoomUserService.update({ uuid: roomUser.uuid, user: options.acting_user, body: { room_user_role_name: options.new_room_user_role_name }});
        // Verify the update
        const updatedRoomUser = await RoomUserService.findOne({ uuid: roomUser.uuid, user: options.user });
        expect(updatedRoomUser.room_user_role_name).toBe(options.new_room_user_role_name);
        // Revert the update
        await RoomUserService.update({ uuid: roomUser.uuid, user: options.acting_user, body: { room_user_role_name: options.old_room_user_role_name }});
        // Verify the revert
        const revertedRoomUser = await RoomUserService.findOne({ uuid: roomUser.uuid, user: options.user });
        expect(revertedRoomUser.room_user_role_name).toBe(options.old_room_user_role_name);
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{ }, 'No uuid provided'],
        [{ uuid: "test" }, 'No user provided'],
        [{ uuid: "test", user: { } }, 'No user.sub provided'],
        [{ uuid: "test", user: { sub: "test" } }, 'No body provided'],
        [{ uuid: "test", user: { sub: "test" }, body: { } }, 'No room_user_role_name provided'],
        [{ uuid: "test", user: { sub: "test" }, body: { room_user_role_name: "test" } }, 'room_user not found'],
    ])(`(${name}) - RoomUserService.update invalid partitions`, async (options, expected) => {
        expect(() => RoomUserService.update(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ 
            user: { sub: user.uuid }, 
            acting_user: context.admin, 
        }],
    ])(`(${name}) - RoomUserService.destroy valid partitions`, async (options) => {
        // Join the user to the room
        await RoomInviteLinkService.join({ uuid: room_invite_link_uuid, user: options.user });
        // Find the room user and destroy it as the acting user
        const roomUser = await RoomUserService.findAuthenticatedUser({ room_uuid: context.room.uuid, user: options.user });
        await RoomUserService.destroy({ uuid: roomUser.uuid, user: options.acting_user });
        // Verify the destroy
        expect(() => RoomUserService.findOne({ uuid: roomUser.uuid, user: options.acting_user }))
            .rejects.toThrow("room_user not found");
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{ }, 'No uuid provided'],
        [{ uuid: "test" }, 'No user provided'],
        [{ uuid: "test", user: { } }, 'No user.sub provided'],
        [{ uuid: "test", user: { sub: "test" } }, 'room_user not found'],
    ])(`(${name}) - RoomUserService.destroy invalid partitions`, async (options, expected) => {
        expect(() => RoomUserService.destroy(options)).rejects.toThrowError(expected);
    });

    /**
     * Security Checks
     */
    test.each([
        [{ room_uuid: context.room.uuid, user: { sub: user.uuid } }],
    ])(`(${name}) - RoomUserService.findAuthenticatedUser returns error for users who are not member`, async (options) => {
        expect(() => RoomUserService.findAuthenticatedUser(options))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [{ room_uuid: context.room.uuid, user: context.admin, requester: { sub: user.uuid } }],
    ])(`(${name}) - RoomUserService.findOne returns error for users who are not member`, async (options) => {
        const roomUser = await RoomUserService.findAuthenticatedUser(options);
        expect(() => RoomUserService.findOne({ uuid: roomUser.uuid, user: options.requester }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [{ room_uuid: context.room.uuid, user: { sub: user.uuid } }],
    ])(`(${name}) - RoomUserService.findAll returns error for users who are not member`, async (options) => {
        expect(() => RoomUserService.findAll(options)).rejects.toThrow("User is not in the room");
    });

    test.each([
        [{ room_uuid: context.room.uuid, user: context.admin, acting_user: { sub: user.uuid } }],
        [{ room_uuid: context.room.uuid, user: context.admin, acting_user: context.mod }],
        [{ room_uuid: context.room.uuid, user: context.admin, acting_user: context.member }],
    ])(`(${name}) - RoomUserService.update returns error for users who are not admin`, async (options) => {
        const roomUser = await RoomUserService.findAuthenticatedUser({ room_uuid: options.room_uuid, user: options.user });
        expect(() => RoomUserService.update({ uuid: roomUser.uuid, user: options.acting_user, body: { room_user_role_name: 'Admin' } }))
            .rejects.toThrow(/User is not an admin of the room|User is not in the room/);
    });

    test.each([
        [{ room_uuid: context.room.uuid, user: context.admin, acting_user: { sub: user.uuid } }],
        [{ room_uuid: context.room.uuid, user: context.admin, acting_user: context.mod }],
        [{ room_uuid: context.room.uuid, user: context.admin, acting_user: context.member }],
    ])(`(${name}) - RoomUserService.destroy returns error for users who are not admin`, async (options) => {
        const roomUser = await RoomUserService.findAuthenticatedUser({ room_uuid: options.room_uuid, user: options.user });
        expect(() => RoomUserService.destroy({ uuid: roomUser.uuid, user: options.acting_user, body: { room_user_role_name: 'Admin' } }))
            .rejects.toThrow(/User is not an admin of the room|User is not in the room/);
    });
};

roomUserServiceTest(RelationalRoomUserService, RelationalRoomInviteLinkService, RelationalUserService, 'Relational');
roomUserServiceTest(DocumentRoomUserService, DocumentRoomInviteLinkService, DocumentUserService, 'Document');
roomUserServiceTest(GraphRoomUserService, GraphRoomInviteLinkService, GraphUserService, 'Graph');
