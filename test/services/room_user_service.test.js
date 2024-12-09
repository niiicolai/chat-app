import RelationalRoomInviteLinkService from '../../src/relational-based/services/room_invite_link_service.js';
import RelationalRoomUserService from '../../src/relational-based/services/room_user_service.js';

import DocumentRoomInviteLinkService from '../../src/document-based/services/room_invite_link_service.js';
import DocumentRoomUserService from '../../src/document-based/services/room_user_service.js';

import GraphRoomInviteLinkService from '../../src/graph-based/services/room_invite_link_service.js';
import GraphRoomUserService from '../../src/graph-based/services/room_user_service.js';

import data from '../../src/seed_data.js';
import { test, expect } from 'vitest';

const roomUserServiceTest = (RoomUserService, RoomInviteLinkService, name) => {

    /**
     * Exisiting entities
     */

    const user = { sub: data.users.find(u => u.username === 'not_in_a_room').uuid };
    const admin = { sub: data.users[0].uuid };
    const mod = { sub: data.users[1].uuid };
    const member = { sub: data.users[2].uuid };
    const room_uuid = data.rooms[0].uuid;
    const room_invite_link_uuid = data.rooms[0].room_invite_link.uuid;



    /**
     * Fake entities
     */

    const fakeId = '1635e897-b84b-4b98-b8cf-5471ff349022';



    /**
     * Expected methods
     */

    test(`(${name}) - RoomUserService must implement expected methods`, () => {
        expect(RoomUserService).toHaveProperty('findAuthenticatedUser');
        expect(RoomUserService).toHaveProperty('findOne');
        expect(RoomUserService).toHaveProperty('findAll');
        expect(RoomUserService).toHaveProperty('update');
        expect(RoomUserService).toHaveProperty('destroy');
    });



    /**
     * RoomUserService.findAuthenticatedUser
     */

    test.each([
        [{ room_uuid, user: admin }, 'Admin'],
        [{ room_uuid, user: mod }, 'Moderator'],
        [{ room_uuid, user: member }, 'Member'],
    ])(`(${name}) - RoomUserService.findAuthenticatedUser valid partitions`, async (options, role) => {
        const roomUser = await RoomUserService.findAuthenticatedUser(options);

        expect(roomUser).toHaveProperty('uuid');
        expect(roomUser).toHaveProperty('room_uuid');
        expect(roomUser).toHaveProperty('user_uuid');
        expect(roomUser).toHaveProperty('room_user_role_name');
        expect(roomUser).toHaveProperty('created_at');
        expect(roomUser).toHaveProperty('updated_at');
        expect(roomUser.room_uuid).toBe(options.room_uuid);
        expect(roomUser.user_uuid).toBe(options.user.sub);
        expect(roomUser.room_user_role_name).toBe(role);
    });

    test.each([
        [undefined, 'No room_uuid provided'],
        [null, 'No options provided'],
        [{ room_uuid: null }, 'No room_uuid provided'],
        [{ room_uuid }, 'No user provided'],
        [{ room_uuid, user: null }, 'No user provided'],
        [{ room_uuid, user: { sub: null } }, 'No user.sub provided'],
    ])(`(${name}) - RoomUserService.findAuthenticatedUser invalid partitions`, async (options, expected) => {
        expect(async () => await RoomUserService.findAuthenticatedUser(options)).rejects.toThrow(expected);
    });



    /**
     * RoomUserService.findOne
     */

    test.each([
        [{ room_uuid, user: admin }, 'Admin'],
        [{ room_uuid, user: mod }, 'Moderator'],
        [{ room_uuid, user: member }, 'Member'],
    ])(`(${name}) - RoomUserService.findOne valid partitions`, async (options, role) => {
        expect(options.room_uuid).toBeDefined();
        const { uuid } = await RoomUserService.findAuthenticatedUser(options);
        const roomUser = await RoomUserService.findOne({ uuid, user: options.user });

        expect(roomUser).toHaveProperty('uuid');
        expect(roomUser).toHaveProperty('room_uuid');
        expect(roomUser).toHaveProperty('user_uuid');
        expect(roomUser).toHaveProperty('room_user_role_name');
        expect(roomUser).toHaveProperty('created_at');
        expect(roomUser).toHaveProperty('updated_at');
        expect(roomUser.room_uuid).toBe(options.room_uuid);
        expect(roomUser.user_uuid).toBe(options.user.sub);
        expect(roomUser.room_user_role_name).toBe(role);
    });

    test.each([
        [undefined, 'No uuid provided'],
        [null, 'No options provided'],
        [{ uuid: null }, 'No uuid provided'],
        [{ uuid: fakeId }, 'No user provided'],
        [{ uuid: fakeId, user: null }, 'No user provided'],
        [{ uuid: fakeId, user: { sub: null } }, 'No user.sub provided'],
    ])(`(${name}) - RoomUserService.findOne invalid partitions`, async (options, expected) => {
        expect(async () => await RoomUserService.findOne(options)).rejects.toThrow(expected);
    });



    /**
     * RoomUserService.findAll
     */

    test.each([
        [{ room_uuid, user: admin }],
        [{ room_uuid, user: mod }],
        [{ room_uuid, user: member }],
        [{ room_uuid, user: admin, limit: 1 }],
        [{ room_uuid, user: mod, limit: 1 }],
        [{ room_uuid, user: member, limit: 1 }],
        [{ room_uuid, user: admin, page: 1, limit: 1 }],
        [{ room_uuid, user: mod, page: 1, limit: 1 }],
        [{ room_uuid, user: member, page: 1, limit: 1 }],
    ])(`(${name}) - RoomUserService.findAll valid partitions`, async (options) => {
        const result = await RoomUserService.findAll(options);

        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('data');

        expect(result.data[0]).toHaveProperty('uuid');
        expect(result.data[0]).toHaveProperty('room_uuid');
        expect(result.data[0]).toHaveProperty('user_uuid');
        expect(result.data[0]).toHaveProperty('room_user_role_name');
        expect(result.data[0]).toHaveProperty('created_at');
        expect(result.data[0]).toHaveProperty('updated_at');
        expect(result.data[0].room_uuid).toBe(options.room_uuid);

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
        [{ room_uuid: fakeId }, 'No user provided'],
        [{ room_uuid: fakeId, user: {} }, 'No user.sub provided'],
        [{ room_uuid: fakeId, user: { sub: fakeId }, page: -1 }, 'page must be greater than 0'],
        [{ room_uuid: fakeId, user: { sub: fakeId }, page: 1 }, 'page requires limit'],
        [{ room_uuid: fakeId, user: { sub: fakeId }, page: 1, limit: -1 }, 'limit must be greater than 0'],
    ])(`(${name}) - RoomUserService.findAll invalid partitions`, async (options, expected) => {
        expect(async () => await RoomUserService.findAll(options)).rejects.toThrowError(expected);
    });



    /**
     * RoomUserService.update
     */

    test.each([
        [{
            room_uuid,
            user: mod,
            acting_user: admin,
            new_room_user_role_name: 'Admin',
            old_room_user_role_name: 'Moderator'
        }],
    ])(`(${name}) - RoomUserService.update valid partitions`, async (options) => {
        // Find the room user and update it as the acting user
        const roomUser = await RoomUserService.findAuthenticatedUser({ room_uuid: options.room_uuid, user: options.user });
        await RoomUserService.update({ uuid: roomUser.uuid, user: options.acting_user, body: { room_user_role_name: options.new_room_user_role_name } });
        // Verify the update
        const updatedRoomUser = await RoomUserService.findOne({ uuid: roomUser.uuid, user: options.user });
        expect(updatedRoomUser.room_user_role_name).toBe(options.new_room_user_role_name);
        // Revert the update
        await RoomUserService.update({ uuid: roomUser.uuid, user: options.acting_user, body: { room_user_role_name: options.old_room_user_role_name } });
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
        [{}, 'No uuid provided'],
        [{ uuid: fakeId }, 'No user provided'],
        [{ uuid: fakeId, user: {} }, 'No user.sub provided'],
        [{ uuid: fakeId, user: { sub: fakeId } }, 'No body provided'],
        [{ uuid: fakeId, user: { sub: fakeId }, body: {} }, 'No room_user_role_name provided'],
        [{ uuid: fakeId, user: { sub: fakeId }, body: { room_user_role_name: "test" } }, 'room_user not found'],
    ])(`(${name}) - RoomUserService.update invalid partitions`, async (options, expected) => {
        expect(async () => await RoomUserService.update(options)).rejects.toThrowError(expected);
    });



    /**
     * RoomUserService.destroy
     */

    test.each([
        [{
            user,
            acting_user: admin,
        }],
    ])(`(${name}) - RoomUserService.destroy valid partitions`, async (options) => {
        // Join the user to the room
        await RoomInviteLinkService.join({ uuid: room_invite_link_uuid, user: options.user });
        // Find the room user and destroy it as the acting user
        const roomUser = await RoomUserService.findAuthenticatedUser({ room_uuid, user: options.user });
        // Verify the room user exists
        expect(roomUser).toBeDefined();
        await RoomUserService.destroy({ uuid: roomUser.uuid, user: options.acting_user });
        // Verify the destroy
        expect(async () => await RoomUserService.findOne({ uuid: roomUser.uuid, user: options.acting_user }))
            .rejects.toThrow("room_user not found");

    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{}, 'No uuid provided'],
        [{ uuid: fakeId }, 'No user provided'],
        [{ uuid: fakeId, user: {} }, 'No user.sub provided'],
        [{ uuid: fakeId, user: { sub: fakeId } }, 'room_user not found'],
    ])(`(${name}) - RoomUserService.destroy invalid partitions`, async (options, expected) => {
        expect(async () => await RoomUserService.destroy(options)).rejects.toThrowError(expected);
    });


    /**
     * Security Checks
     */

    test.each([
        [{ room_uuid, user }],
    ])(`(${name}) - RoomUserService.findAuthenticatedUser returns error for users who are not member`, async (options) => {
        expect(async () => await RoomUserService.findAuthenticatedUser(options))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [{ room_uuid, user: admin, requester: user }],
    ])(`(${name}) - RoomUserService.findOne returns error for users who are not member`, async (options) => {
        const roomUser = await RoomUserService.findAuthenticatedUser(options);
        expect(async () => await RoomUserService.findOne({ uuid: roomUser.uuid, user: options.requester }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [{ room_uuid, user }],
    ])(`(${name}) - RoomUserService.findAll returns error for users who are not member`, async (options) => {
        expect(async () => await RoomUserService.findAll(options)).rejects.toThrow("User is not in the room");
    });

    test.each([
        [{ room_uuid, user: admin, acting_user: user }],
        [{ room_uuid, user: admin, acting_user: mod }],
        [{ room_uuid, user: admin, acting_user: member }],
    ])(`(${name}) - RoomUserService.update returns error for users who are not admin`, async (options) => {
        const roomUser = await RoomUserService.findAuthenticatedUser({ room_uuid: options.room_uuid, user: options.user });
        expect(async () => await RoomUserService.update({ uuid: roomUser.uuid, user: options.acting_user, body: { room_user_role_name: 'Admin' } }))
            .rejects.toThrow("User is not an admin of the room");
    });

    test.each([
        [{ room_uuid, user: admin, acting_user: user }],
        [{ room_uuid, user: admin, acting_user: mod }],
        [{ room_uuid, user: admin, acting_user: member }],
    ])(`(${name}) - RoomUserService.destroy returns error for users who are not admin`, async (options) => {
        const roomUser = await RoomUserService.findAuthenticatedUser({ room_uuid: options.room_uuid, user: options.user });
        expect(async () => await RoomUserService.destroy({ uuid: roomUser.uuid, user: options.acting_user, body: { room_user_role_name: 'Admin' } }))
            .rejects.toThrow("User is not an admin of the room");
    });
};

roomUserServiceTest(RelationalRoomUserService, RelationalRoomInviteLinkService, 'Relational');
roomUserServiceTest(DocumentRoomUserService, DocumentRoomInviteLinkService, 'Document');
//roomUserServiceTest(GraphRoomUserService, GraphRoomInviteLinkService, 'Graph');
