import RelationalRoomFileService from '../../src/relational-based/services/room_file_service.js';
import DocumentRoomFileService from '../../src/document-based/services/room_file_service.js';
import GraphRoomFileService from '../../src/graph-based/services/room_file_service.js';

import data from '../../src/seed_data.js';
import { test, expect } from 'vitest';

const roomFileServiceTest = (RoomFileService, name) => {

    /**
     * Exisiting entities
     */

    const user = { sub: data.users.find(u => u.username === 'not_in_a_room').uuid };
    const room_uuid = data.rooms[0].uuid;
    const admin = { sub: data.users[0].uuid };
    const mod = { sub: data.users[1].uuid };
    const member = { sub: data.users[2].uuid };



    /**
     * Fake entities
     */

    const fakeId = '1635e897-b84b-4b98-b8cf-5471ff349022';



    /**
     * Expected Methods
     */

    test(`(${name}) - RoomFileService must implement expected methods`, () => {
        expect(RoomFileService).toHaveProperty('findOne');
        expect(RoomFileService).toHaveProperty('findAll');
        expect(RoomFileService).toHaveProperty('destroy');
    });



    /**
     * RoomFileService.findAll
     */

    test.each([
        [{ room_uuid, user: admin, limit: 2 }],
        [{ room_uuid, user: mod, limit: 1 }],
        [{ room_uuid, user: member, limit: 1, page: 1 }],
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
        [{ room_uuid: fakeId }, 'No user provided'],
        [{ room_uuid: fakeId, user: {}, page: 1 }, 'No user.sub provided'],
        [{ room_uuid: fakeId, user: { sub: fakeId }, page: 1 }, 'page requires limit'],
        [{ room_uuid: fakeId, user: { sub: fakeId }, page: -1 }, 'page must be greater than 0'],
        [{ room_uuid: fakeId, user: { sub: fakeId }, page: "test" }, 'page must be a number'],
        [{ room_uuid: fakeId, user: { sub: fakeId }, page: 1, limit: -1 }, 'limit must be greater than 0'],
        [{ room_uuid: fakeId, user: { sub: fakeId }, page: 1, limit: "test" }, 'limit must be a number'],
    ])(`(${name}) - RoomFileService.findAll invalid partitions`, async (options, expected) => {
        expect(async () => await RoomFileService.findAll(options)).rejects.toThrowError(expected);
    });



    /**
     * RoomFileService.findOne
     */

    test(`(${name}) - RoomFileService.findOne valid partitions`, async () => {
        const files = await RoomFileService.findAll({ room_uuid, user: admin, limit: 1 });
        expect(files.data.length).toBeGreaterThan(0);
        const result = await RoomFileService.findOne({ uuid: files.data[0].uuid, user: admin });

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
        [{ uuid: fakeId }, 'No user provided'],
        [{ uuid: fakeId, user: { } }, 'No user.sub provided'],
        [{ uuid: fakeId, user: { sub: fakeId } }, 'room_file not found'],
    ])(`(${name}) - RoomFileService.findOne invalid partitions`, async (options, expected) => {
        expect(async () => await RoomFileService.findOne(options)).rejects.toThrowError(expected);
    });


    

    /**
     * Security Checks
     */

    test.each([
        [user],
    ])(`(${name}) - RoomFileService.findOne return error for users who are not member`, async (user) => {
        const files = await RoomFileService.findAll({ room_uuid, user: admin, limit: 1 });
        expect(async () => await RoomFileService.findOne({ user, uuid: files.data[0].uuid }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [user],
    ])(`(${name}) - RoomFileService.findAll return error for users who are not member`, async (user) => {
        expect(async () => await RoomFileService.findAll({ room_uuid, user }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [member],
        [user],
    ])(`(${name}) - RoomFileService.destroy return error for users who are not admin or moderator`, async (user) => {
        const { data } = await RoomFileService.findAll({ room_uuid, user: admin, limit: 2 });

        expect(async () => await RoomFileService.destroy({ uuid: data[0].uuid, user }, true))
            .rejects.toThrow("User is not an owner of the room_file, or an admin or moderator of the room");
    });
};

roomFileServiceTest(RelationalRoomFileService, 'Relational');
roomFileServiceTest(DocumentRoomFileService, 'Document');
roomFileServiceTest(GraphRoomFileService, 'Graph');
