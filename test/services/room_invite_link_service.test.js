import RelationalUserService from '../../src/relational-based/services/user_service.js';
import RelationalRoomUserService from '../../src/relational-based/services/room_user_service.js';
import RelationalRoomInviteLinkService from '../../src/relational-based/services/room_invite_link_service.js';

import DocumentUserService from '../../src/document-based/services/user_service.js';
import DocumentRoomUserService from '../../src/document-based/services/room_user_service.js';
import DocumentRoomInviteLinkService from '../../src/document-based/services/room_invite_link_service.js';

import GraphUserService from '../../src/graph-based/services/user_service.js';
import GraphRoomUserService from '../../src/graph-based/services/room_user_service.js';
import GraphRoomInviteLinkService from '../../src/graph-based/services/room_invite_link_service.js';

import { test, beforeAll, expect } from 'vitest';
import { context } from '../context.js';
import { v4 as uuidv4 } from 'uuid';

const isValidRoomInviteLink = (roomInviteLink) => {
    expect(roomInviteLink).toHaveProperty('uuid');
    expect(roomInviteLink).toHaveProperty('room_uuid');
    expect(roomInviteLink).toHaveProperty('expires_at');
    expect(roomInviteLink).toHaveProperty('never_expires');
    expect(roomInviteLink).toHaveProperty('created_at');
    expect(roomInviteLink).toHaveProperty('updated_at');
    expect(roomInviteLink.room_uuid).toBe(context.room.uuid);
    expect(roomInviteLink.never_expires).toBe(true);
    expect(roomInviteLink.expires_at).toBe(null);
};

const roomInviteLinkServiceTest = (RoomInviteLinkService, RoomUserService, UserService, name) => {
    const room_invite_link_uuid = uuidv4();
    const user = { 
        uuid: uuidv4(),
        username: `test-${uuidv4()}`,
        email: `test-${uuidv4()}@example.com`,
        password: '12345678',
    };

    beforeAll(async () => {
        await UserService.create({ body: user });
    });

    test(`(${name}) - RoomInviteLinkService must implement expected methods`, () => {
        expect(RoomInviteLinkService).toHaveProperty('create');
        expect(RoomInviteLinkService).toHaveProperty('destroy');
        expect(RoomInviteLinkService).toHaveProperty('update');
        expect(RoomInviteLinkService).toHaveProperty('findOne');
        expect(RoomInviteLinkService).toHaveProperty('findAll');
        expect(RoomInviteLinkService).toHaveProperty('join');
    });

    test.each([
        [{ user: context.admin, body: { uuid: room_invite_link_uuid, room_uuid: context.room.uuid } }],
    ])(`(${name}) - RoomInviteLinkService.create valid partitions`, async (options) => {
        isValidRoomInviteLink(await RoomInviteLinkService.create(options));
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
        [{ body: { uuid: 'test' }, user: { sub: "test" } }, 'No room_uuid provided'],
        [{ body: { room_uuid: 'test' }, user: { sub: "test" } }, 'No uuid provided'],
    ])(`(${name}) - RoomInviteLinkService.create invalid partitions`, async (options, expected) => {
        expect(async () => await RoomInviteLinkService.create(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ user: context.admin, uuid: room_invite_link_uuid, body: { expires_at: null } }],
    ])(`(${name}) - RoomInviteLinkService.update valid partitions`, async (options) => {
        isValidRoomInviteLink(await RoomInviteLinkService.update(options));
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{}, 'No uuid provided'],
        [{ uuid: "test" }, 'No user provided'],
        [{ uuid: "test", body: {} }, 'No user provided'],
        [{ body: {}, user: "test" }, 'No uuid provided'],
        [{ uuid: "test", body: {}, user: {} }, 'No user.sub provided'],
        [{ body: {}, user: { sub: "test" } }, 'No uuid provided'],
    ])(`(${name}) - RoomInviteLinkService.update invalid partitions`, async (options, expected) => {
        expect(async () => await RoomInviteLinkService.update(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ user: context.admin, uuid: room_invite_link_uuid }],
    ])(`(${name}) - RoomInviteLinkService.findOne valid partitions`, async (options) => {
        isValidRoomInviteLink(await RoomInviteLinkService.findOne(options));
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
    ])(`(${name}) - RoomInviteLinkService.findOne invalid partitions`, async (options, expected) => {
        expect(async () => await RoomInviteLinkService.findOne(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ user: context.mod, room_uuid: context.room.uuid, uuid: room_invite_link_uuid }],
        [{ user: context.member, room_uuid: context.room.uuid, uuid: room_invite_link_uuid }],
        [{ user: context.admin, room_uuid: context.room.uuid, uuid: room_invite_link_uuid }],
        [{ user: context.admin, room_uuid: context.room.uuid, uuid: room_invite_link_uuid, limit: 1 }],
        [{ user: context.admin, room_uuid: context.room.uuid, uuid: room_invite_link_uuid, limit: 1, page: 1 }],
    ])(`(${name}) - RoomInviteLinkService.findAll valid partitions`, async (options) => {
        const result = await RoomInviteLinkService.findAll(options);

        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('data');

        isValidRoomInviteLink(result.data[0]);

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
        [{ room_uuid: "test" }, 'No user provided'],
        [{ room_uuid: "test", user: context.admin }, 'User is not in the room'],
        [{ room_uuid: "test", user: context.admin, page: 1 }, 'page requires limit'],
        [{ room_uuid: "test", user: context.admin, page: -1 }, 'page must be greater than 0'],
        [{ room_uuid: "test", user: context.admin, page: "test" }, 'page must be a number'],
        [{ room_uuid: "test", user: context.admin, page: 1, limit: -1 }, 'limit must be greater than 0'],
        [{ room_uuid: "test", user: context.admin, page: 1, limit: "test" }, 'limit must be a number'],
    ])(`(${name}) - RoomInviteLinkService.findAll invalid partitions`, async (options, expected) => {
        expect(async () => await RoomInviteLinkService.findAll(options)).rejects.toThrowError(expected);
    });

    /**
     * Security Checks
     */

    test.each([
        [context.mod.sub],
        [context.member.sub],
        [user.uuid],
    ])(`(${name}) - RoomInviteLinkService.create return error for users who are not admin`, async (sub) => {
        expect(async () => await RoomInviteLinkService.create({ user: { sub }, body: { uuid: uuidv4(), room_uuid: context.room.uuid } }))
            .rejects.toThrowError("User is not an admin of the room");
    });

    test.each([
        [context.mod.sub],
        [context.member.sub],
        [user.uuid],
    ])(`(${name}) - RoomInviteLinkService.destroy return error for users who are not admin`, async (sub) => {
        expect(async () => await RoomInviteLinkService.destroy({ user: { sub }, uuid: room_invite_link_uuid }))
            .rejects.toThrowError(/User is not an admin of the room|User is not in the room/);
    });

    test.each([
        [context.mod.sub],
        [context.member.sub],
        [user.uuid],
    ])(`(${name}) - RoomInviteLinkService.update return error for users who are not admin`, async (sub) => {
        expect(async () => await RoomInviteLinkService.update({ user: { sub }, uuid: room_invite_link_uuid, body: { expires_at: null } }))
            .rejects.toThrow(/User is not an admin of the room|User is not in the room/);
    });

    test.each([
        [user.uuid],
    ])(`(${name}) - RoomInviteLinkService.findOne return error for users who are not member`, async (sub) => {
        expect(async () => await RoomInviteLinkService.findOne({ user: { sub }, uuid: room_invite_link_uuid }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [user.uuid],
    ])(`(${name}) - RoomInviteLinkService.findAll return error for users who are not member`, async (sub) => {
        expect(async () => await RoomInviteLinkService.findAll({ user: { sub }, room_uuid: context.room.uuid }))
            .rejects.toThrow("User is not in the room");
    });

    /**
     * Test join and destroy after security checks to avoid any conflicts
     */

    test.each([
        [{ user: { sub: user.uuid }, uuid: room_invite_link_uuid }],
    ])(`(${name}) - RoomInviteLinkService.join valid partitions`, async (options) => {
        await RoomInviteLinkService.join(options);

        const { data } = await RoomUserService.findAll({ user: { sub: user.uuid }, room_uuid: context.room.uuid });
        const roomUser = data.find(roomUser => roomUser.user_uuid === user.uuid);
        expect(roomUser.user_uuid).toBe(user.uuid);
        await RoomUserService.destroy({ user: context.admin, uuid: roomUser.uuid });
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{ uuid: "test" }, 'No user provided'],
        [{ uuid: "test", user: { } }, 'No user.sub provided'],
    ])(`(${name}) - RoomInviteLinkService.join invalid partitions`, async (options, expected) => {
        expect(async () => await RoomInviteLinkService.join(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ user: context.admin, uuid: room_invite_link_uuid }],
    ])(`(${name}) - RoomInviteLinkService.destroy valid partitions`, async (options) => {
        await RoomInviteLinkService.destroy(options);
        expect(async () => await RoomInviteLinkService.findOne(options))
            .rejects.toThrow("room_invite_link not found");
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{ uuid: "test" }, 'No user provided'],
        [{ uuid: "test", user: { } }, 'No user.sub provided'],
    ])(`(${name}) - RoomInviteLinkService.destroy invalid partitions`, async (options, expected) => {
        expect(async () => await RoomInviteLinkService.destroy(options)).rejects.toThrowError(expected);
    });
};

roomInviteLinkServiceTest(RelationalRoomInviteLinkService, RelationalRoomUserService, RelationalUserService, 'Relational');
roomInviteLinkServiceTest(DocumentRoomInviteLinkService, DocumentRoomUserService, DocumentUserService, 'Document');
roomInviteLinkServiceTest(GraphRoomInviteLinkService, GraphRoomUserService, GraphUserService, 'Graph');
