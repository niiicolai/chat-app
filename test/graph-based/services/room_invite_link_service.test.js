import UserService from '../../../src/graph-based/services/user_service.js';
import RoomUserService from '../../../src/graph-based/services/room_user_service.js';
import RoomInviteLinkService from '../../../src/graph-based/services/room_invite_link_service.js';
import { test, describe, expect } from 'vitest';
import { context } from '../../context.js';
import { v4 as uuidv4 } from 'uuid';

const isValidRoomInviteLink = (roomInviteLink) => {
    expect(roomInviteLink).toHaveProperty('uuid');
    expect(roomInviteLink).toHaveProperty('room_uuid');
    expect(roomInviteLink).toHaveProperty('expires_at');
    expect(roomInviteLink).toHaveProperty('never_expires');
    expect(roomInviteLink).toHaveProperty('created_at');
    expect(roomInviteLink).toHaveProperty('updated_at');
    expect(roomInviteLink.room_uuid).toBe(context.room.uuid);
    expect(roomInviteLink.expires_at).toBe(null);
    expect(roomInviteLink.never_expires).toBe(true);
};

describe('RoomInviteLinkService Tests', async () => {
    const room_invite_link_uuid = uuidv4();
    const { user } = await UserService.create({
        body: {
            uuid: uuidv4(),
            username: `test-${uuidv4()}`,
            email: `test-${uuidv4()}@example.com`,
            password: '12345678',
        }
    });

    test.each([
        [{ user: context.admin, body: { uuid: room_invite_link_uuid, room_uuid: context.room.uuid } }],
    ])('RoomInviteLinkService.create valid partitions', async (options) => {
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
    ])('RoomInviteLinkService.create invalid partitions', async (options, expected) => {
        expect(() => RoomInviteLinkService.create(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ user: context.admin, uuid: room_invite_link_uuid, body: { expires_at: null } }],
    ])('RoomInviteLinkService.update valid partitions', async (options) => {
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
    ])('RoomInviteLinkService.update invalid partitions', async (options, expected) => {
        expect(() => RoomInviteLinkService.update(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ user: context.admin, uuid: room_invite_link_uuid }],
    ])('RoomInviteLinkService.findOne valid partitions', async (options) => {
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
    ])('RoomInviteLinkService.findOne invalid partitions', async (options, expected) => {
        expect(() => RoomInviteLinkService.findOne(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ user: context.mod, room_uuid: context.room.uuid, uuid: room_invite_link_uuid }],
        [{ user: context.member, room_uuid: context.room.uuid, uuid: room_invite_link_uuid }],
        [{ user: context.admin, room_uuid: context.room.uuid, uuid: room_invite_link_uuid }],
        [{ user: context.admin, room_uuid: context.room.uuid, uuid: room_invite_link_uuid, limit: 1 }],
        [{ user: context.admin, room_uuid: context.room.uuid, uuid: room_invite_link_uuid, limit: 1, page: 1 }],
    ])('RoomInviteLinkService.findAll valid partitions', async (options) => {
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
        [{ room_uuid: "test", user: context.admin }, 'Room not found'],
        [{ room_uuid: "test", user: context.admin, page: 1 }, 'page requires limit'],
        [{ room_uuid: "test", user: context.admin, page: -1 }, 'page must be greater than 0'],
        [{ room_uuid: "test", user: context.admin, page: "test" }, 'page must be a number'],
        [{ room_uuid: "test", user: context.admin, page: 1, limit: -1 }, 'limit must be greater than 0'],
        [{ room_uuid: "test", user: context.admin, page: 1, limit: "test" }, 'limit must be a number'],
    ])('RoomInviteLinkService.findAll invalid partitions', async (options, expected) => {
        expect(() => RoomInviteLinkService.findAll(options)).rejects.toThrowError(expected);
    });

    /**
     * Security Checks
     */

    test.each([
        [context.mod.sub],
        [context.member.sub],
        [user.uuid],
    ])('RoomInviteLinkService.create return error for users who are not admin', async (sub) => {
        expect(() => RoomInviteLinkService.create({ user: { sub }, body: { uuid: uuidv4(), room_uuid: context.room.uuid } }))
            .rejects.toThrowError(/User is not an admin of the room|Room not found/);
    });

    test.each([
        [context.mod.sub],
        [context.member.sub],
        [user.uuid],
    ])('RoomInviteLinkService.destroy return error for users who are not admin', async (sub) => {
        expect(() => RoomInviteLinkService.destroy({ user: { sub }, uuid: room_invite_link_uuid }))
            .rejects.toThrowError(/User is not an admin of the room|User is not in the room/);
    });

    test.each([
        [context.mod.sub],
        [context.member.sub],
        [user.uuid],
    ])('RoomInviteLinkService.update return error for users who are not admin', async (sub) => {
        expect(() => RoomInviteLinkService.update({ user: { sub }, uuid: room_invite_link_uuid, body: { expires_at: null } }))
            .rejects.toThrow(/User is not an admin of the room|User is not in the room/);
    });

    test.each([
        [user.uuid],
    ])('RoomInviteLinkService.findOne return error for users who are not member', async (sub) => {
        expect(() => RoomInviteLinkService.findOne({ user: { sub }, uuid: room_invite_link_uuid }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [user.uuid],
    ])('RoomInviteLinkService.findAll return error for users who are not member', async (sub) => {
        expect(() => RoomInviteLinkService.findAll({ user: { sub }, room_uuid: context.room.uuid }))
            .rejects.toThrow("User is not in the room");
    });

    /**
     * Test join and destroy after security checks to avoid any conflicts
     */

    test.each([
        [{ user: { sub: user.uuid }, uuid: room_invite_link_uuid }],
    ])('RoomInviteLinkService.join valid partitions', async (options) => {
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
    ])('RoomInviteLinkService.join invalid partitions', async (options, expected) => {
        expect(() => RoomInviteLinkService.join(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ user: context.admin, uuid: room_invite_link_uuid }],
    ])('RoomInviteLinkService.destroy valid partitions', async (options) => {
        await RoomInviteLinkService.destroy(options);
        expect(() => RoomInviteLinkService.findOne(options)).rejects.toThrow("Room Invite Link not found");
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{ uuid: "test" }, 'No user provided'],
        [{ uuid: "test", user: { } }, 'No user.sub provided'],
    ])('RoomInviteLinkService.destroy invalid partitions', async (options, expected) => {
        expect(() => RoomInviteLinkService.destroy(options)).rejects.toThrowError(expected);
    });
});
