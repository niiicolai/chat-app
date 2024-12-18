import RelationalRoomInviteLinkService from '../../src/relational-based/services/room_invite_link_service.js';
import RelationalRoomUserService from '../../src/relational-based/services/room_user_service.js';

import DocumentRoomInviteLinkService from '../../src/document-based/services/room_invite_link_service.js';
import DocumentRoomUserService from '../../src/document-based/services/room_user_service.js';

import GraphRoomInviteLinkService from '../../src/graph-based/services/room_invite_link_service.js';
import GraphRoomUserService from '../../src/graph-based/services/room_user_service.js';

import data from '../../src/seed_data.js';
import { test, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

const roomInviteLinkServiceTest = (RoomInviteLinkService, RoomUserService, name) => {

    /**
     * Exisiting entities
     */
    
    const user = { sub: data.users.find(u => u.username === 'not_in_a_room').uuid };
    const admin = { sub: data.users[0].uuid };
    const mod = { sub: data.users[1].uuid };
    const member = { sub: data.users[2].uuid };
    // This must use its own room_uuid too avoid
    // conflicts with other tests
    const room_uuid = data.rooms[1].uuid;



    /**
     * Fake entities
     */

    const fakeId = '1635e897-b84b-4b98-b8cf-5471ff349022';



    /**
     * New room invite link uuid
     */
    const new_room_invite_link_uuid = uuidv4();



    /**
     * Expected Methods
     */

    test(`(${name}) - RoomInviteLinkService must implement expected methods`, () => {
        expect(RoomInviteLinkService).toHaveProperty('create');
        expect(RoomInviteLinkService).toHaveProperty('destroy');
        expect(RoomInviteLinkService).toHaveProperty('update');
        expect(RoomInviteLinkService).toHaveProperty('findOne');
        expect(RoomInviteLinkService).toHaveProperty('findAll');
        expect(RoomInviteLinkService).toHaveProperty('join');
    });



    /**
     * RoomInviteLinkService.create
     */

    test.each([
        [{ user: admin, body: { uuid: new_room_invite_link_uuid, room_uuid } }],
    ])(`(${name}) - RoomInviteLinkService.create valid partitions`, async (options) => {
        const roomInviteLink = await RoomInviteLinkService.create(options);

        expect(roomInviteLink).toHaveProperty('uuid');
        expect(roomInviteLink).toHaveProperty('room_uuid');
        expect(roomInviteLink).toHaveProperty('expires_at');
        expect(roomInviteLink).toHaveProperty('never_expires');
        expect(roomInviteLink).toHaveProperty('created_at');
        expect(roomInviteLink).toHaveProperty('updated_at');
        expect(roomInviteLink.room_uuid).toBe(room_uuid);
        expect(roomInviteLink.never_expires).toBe(true);
        expect(roomInviteLink.expires_at).toBe(null);
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
        [{ body: {}, user: { sub: fakeId } }, 'No uuid provided'],
        [{ body: { uuid: fakeId }, user: { sub: fakeId } }, 'No room_uuid provided'],
        [{ body: { room_uuid: fakeId }, user: { sub: fakeId } }, 'No uuid provided'],
        [{ body: { room_uuid: fakeId, uuid: fakeId }, user: { sub: fakeId } }, 'room not found'],
        [{ body: { room_uuid, uuid: new_room_invite_link_uuid }, user: admin }, `room_invite_link with PRIMARY ${new_room_invite_link_uuid} already exists`],
        [{ body: { room_uuid, uuid: uuidv4(), expires_at: "test" }, user: admin }, `Invalid time value`],
        [{ body: { room_uuid, uuid: uuidv4(), expires_at: "2000-01-01" }, user: admin }, `The expiration date cannot be in the past`],
    ])(`(${name}) - RoomInviteLinkService.create invalid partitions`, async (options, expected) => {
        expect(async () => await RoomInviteLinkService.create(options)).rejects.toThrowError(expected);
    });



    /**
     * RoomInviteLinkService.update
     */

    test.each([
        [{ user: admin, uuid: new_room_invite_link_uuid, body: { expires_at: null } }],
    ])(`(${name}) - RoomInviteLinkService.update valid partitions`, async (options) => {
        const roomInviteLink = await RoomInviteLinkService.update(options);

        expect(roomInviteLink).toHaveProperty('uuid');
        expect(roomInviteLink).toHaveProperty('room_uuid');
        expect(roomInviteLink).toHaveProperty('expires_at');
        expect(roomInviteLink).toHaveProperty('never_expires');
        expect(roomInviteLink).toHaveProperty('created_at');
        expect(roomInviteLink).toHaveProperty('updated_at');
        expect(roomInviteLink.room_uuid).toBe(room_uuid);
        expect(roomInviteLink.never_expires).toBe(true);
        expect(roomInviteLink.expires_at).toBe(null);
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{}, 'No uuid provided'],
        [{ uuid: fakeId }, 'No user provided'],
        [{ uuid: fakeId, body: {} }, 'No user provided'],
        [{ body: {}, user: fakeId }, 'No uuid provided'],
        [{ uuid: fakeId, body: {}, user: {} }, 'No user.sub provided'],
        [{ body: {}, user: { sub: fakeId } }, 'No uuid provided'],
        [{ body: { }, uuid: fakeId, user: { sub: fakeId } }, 'room_invite_link not found'],
        [{ body: { expires_at: "2000-01-01" }, uuid: new_room_invite_link_uuid, user: admin }, 'The expiration date cannot be in the past'],
    ])(`(${name}) - RoomInviteLinkService.update invalid partitions`, async (options, expected) => {
        expect(async () => await RoomInviteLinkService.update(options)).rejects.toThrowError(expected);
    });



    /**
     * RoomInviteLinkService.findOne
     */

    test.each([
        [{ user: admin, uuid: new_room_invite_link_uuid }],
        [{ user: mod, uuid: new_room_invite_link_uuid }],
        [{ user: member, uuid: new_room_invite_link_uuid }],
    ])(`(${name}) - RoomInviteLinkService.findOne valid partitions`, async (options) => {
        const roomInviteLink = await RoomInviteLinkService.findOne(options);

        expect(roomInviteLink).toHaveProperty('uuid');
        expect(roomInviteLink).toHaveProperty('room_uuid');
        expect(roomInviteLink).toHaveProperty('expires_at');
        expect(roomInviteLink).toHaveProperty('never_expires');
        expect(roomInviteLink).toHaveProperty('created_at');
        expect(roomInviteLink).toHaveProperty('updated_at');
        expect(roomInviteLink.room_uuid).toBe(room_uuid);
        expect(roomInviteLink.never_expires).toBe(true);
        expect(roomInviteLink.expires_at).toBe(null);
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
        [{ uuid: fakeId, user: { sub: fakeId } }, 'room_invite_link not found'],
    ])(`(${name}) - RoomInviteLinkService.findOne invalid partitions`, async (options, expected) => {
        expect(async () => await RoomInviteLinkService.findOne(options)).rejects.toThrowError(expected);
    });



    /**
     * RoomInviteLinkService.findAll
     */

    test.each([
        [{ user: mod, room_uuid }],
        [{ user: member, room_uuid }],
        [{ user: admin, room_uuid }],
        [{ user: admin, room_uuid, limit: 1 }],
        [{ user: admin, room_uuid, limit: 1, page: 1 }],
    ])(`(${name}) - RoomInviteLinkService.findAll valid partitions`, async (options) => {
        const result = await RoomInviteLinkService.findAll(options);

        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('data');

        expect(result.data[0]).toHaveProperty('uuid');
        expect(result.data[0]).toHaveProperty('room_uuid');
        expect(result.data[0]).toHaveProperty('expires_at');
        expect(result.data[0]).toHaveProperty('never_expires');
        expect(result.data[0]).toHaveProperty('created_at');
        expect(result.data[0]).toHaveProperty('updated_at');
        expect(result.data[0].room_uuid).toBe(room_uuid);
        expect(result.data[0].never_expires).toBe(true);
        expect(result.data[0].expires_at).toBe(null);

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
        [{ room_uuid: fakeId }, 'No user provided'],
        [{ room_uuid: fakeId, user: admin }, 'User is not in the room'],
        [{ room_uuid: fakeId, user: admin, page: 1 }, 'page requires limit'],
        [{ room_uuid: fakeId, user: admin, page: -1 }, 'page must be greater than 0'],
        [{ room_uuid: fakeId, user: admin, page: "test" }, 'page must be a number'],
        [{ room_uuid: fakeId, user: admin, page: 1, limit: -1 }, 'limit must be greater than 0'],
        [{ room_uuid: fakeId, user: admin, page: 1, limit: "test" }, 'limit must be a number'],
    ])(`(${name}) - RoomInviteLinkService.findAll invalid partitions`, async (options, expected) => {
        expect(async () => await RoomInviteLinkService.findAll(options)).rejects.toThrowError(expected);
    });


    
    /**
     * Security Checks
     */

    test.each([
        [mod],
        [member],
        [user],
    ])(`(${name}) - RoomInviteLinkService.create return error for users who are not admin`, async (user) => {
        expect(async () => await RoomInviteLinkService.create({ user, body: { uuid: uuidv4(), room_uuid } }))
            .rejects.toThrowError("User is not an admin of the room");
    });
    
    test.each([
        [mod],
        [member],
        [user],
    ])(`(${name}) - RoomInviteLinkService.destroy return error for users who are not admin`, async (user) => {
        expect(async () => await RoomInviteLinkService.destroy({ user, uuid: new_room_invite_link_uuid }))
            .rejects.toThrowError("User is not an admin of the room");
    });

    test.each([
        [mod],
        [member],
        [user],
    ])(`(${name}) - RoomInviteLinkService.update return error for users who are not admin`, async (user) => {
        expect(async () => await RoomInviteLinkService.update({ user, uuid: new_room_invite_link_uuid, body: { expires_at: null } }))
            .rejects.toThrow("User is not an admin of the room");
    });

    test.each([
        [user],
    ])(`(${name}) - RoomInviteLinkService.findOne return error for users who are not member`, async (user) => {
        expect(async () => await RoomInviteLinkService.findOne({ user, uuid: new_room_invite_link_uuid }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [user],
    ])(`(${name}) - RoomInviteLinkService.findAll return error for users who are not member`, async (user) => {
        expect(async () => await RoomInviteLinkService.findAll({ user, room_uuid }))
            .rejects.toThrow("User is not in the room");
    });



    /**
     * RoomInviteLinkService.join
     */

    test.each([
        [{ user, uuid: new_room_invite_link_uuid }],
    ])(`(${name}) - RoomInviteLinkService.join valid partitions`, async (options) => {
        await RoomInviteLinkService.join(options);

        const { data } = await RoomUserService.findAll({ user: admin, room_uuid });

        const roomUser = data.find(roomUser => roomUser.user_uuid === options.user.sub);
        expect(roomUser.user_uuid).toBe(options.user.sub);
        expect(roomUser.room_uuid).toBe(room_uuid);
        expect(roomUser.room_user_role_name).toBe('Member');
        await RoomUserService.destroy({ user: admin, uuid: roomUser.uuid });
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{ uuid: fakeId }, 'No user provided'],
        [{ uuid: fakeId, user: {} }, 'No user.sub provided'],
    ])(`(${name}) - RoomInviteLinkService.join invalid partitions`, async (options, expected) => {
        expect(async () => await RoomInviteLinkService.join(options)).rejects.toThrowError(expected);
    });



    /**
     * RoomInviteLinkService.destroy
     */

    test.each([
        [{ user: admin, uuid: new_room_invite_link_uuid }],
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
        [{ uuid: fakeId }, 'No user provided'],
        [{ uuid: fakeId, user: {} }, 'No user.sub provided'],
        [{ uuid: fakeId, user: { sub: fakeId } }, 'room_invite_link not found'],
    ])(`(${name}) - RoomInviteLinkService.destroy invalid partitions`, async (options, expected) => {
        expect(async () => await RoomInviteLinkService.destroy(options)).rejects.toThrowError(expected);
    });
};

roomInviteLinkServiceTest(RelationalRoomInviteLinkService, RelationalRoomUserService, 'Relational');
roomInviteLinkServiceTest(DocumentRoomInviteLinkService, DocumentRoomUserService, 'Document');
roomInviteLinkServiceTest(GraphRoomInviteLinkService, GraphRoomUserService, 'Graph');
