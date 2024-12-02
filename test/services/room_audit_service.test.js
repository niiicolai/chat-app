import RelationalRoomAuditService from '../../src/relational-based/services/room_audit_service.js';
import DocumentRoomAuditService from '../../src/document-based/services/room_audit_service.js';
import GraphRoomAuditService from '../../src/graph-based/services/room_audit_service.js';

import data from '../../src/seed_data.js';
import { test, expect } from 'vitest';

const roomAuditServiceTest = (RoomAuditService, name) => {

    /**
     * Exisiting entities
     */

    const user = { sub: data.users.find(u => u.username === 'not_in_a_room').uuid };
    const room_uuid = data.rooms[0].uuid;
    const admin = { sub: data.users[0].uuid };



    /**
     * Expected Methods
     */

    test(`(${name}) - RoomAuditService must implement expected methods`, () => {
        expect(RoomAuditService).toHaveProperty('findOne');
        expect(RoomAuditService).toHaveProperty('findAll');
    });



    /**
     * RoomAuditService.findAll
     */

    test.each([
        [{ room_uuid, user: admin, limit: 2 }],
        [{ room_uuid, user: admin, limit: 1 }],
        [{ room_uuid, user: admin, limit: 2, page: 1 }],
    ])(`(${name}) - RoomAuditService.findAll valid partitions`, async (options) => {
        const result = await RoomAuditService.findAll(options);

        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('data');

        expect(result.data[0]).toHaveProperty('uuid');
        expect(result.data[0]).toHaveProperty('body');
        expect(result.data[0]).toHaveProperty('room_audit_type_name');
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
        [null, 'Invalid options provided'],
        ["", 'Invalid options provided'],
        [1, 'Invalid options provided'],
        [0, 'Invalid options provided'],
        [[], 'Invalid options provided'],
        [{ page: 1 }, 'No room_uuid provided'],
        [{ room_uuid: "test" }, 'No user provided'],
        [{ room_uuid: "test", user: {}, page: 1 }, 'No user.sub provided'],
        [{ room_uuid: "test", user: { sub: "test" }, page: 1 }, 'page requires limit'],
        [{ room_uuid: "test", user: { sub: "test" }, page: -1 }, 'page must be greater than 0'],
        [{ room_uuid: "test", user: { sub: "test" }, page: "test" }, 'page must be a number'],
        [{ room_uuid: "test", user: { sub: "test" }, page: 1, limit: -1 }, 'limit must be greater than 0'],
        [{ room_uuid: "test", user: { sub: "test" }, page: 1, limit: "test" }, 'limit must be a number'],
    ])(`(${name}) - RoomAuditService.findAll invalid partitions`, async (options, expected) => {
        expect(async () => await RoomAuditService.findAll(options)).rejects.toThrowError(expected);
    });



    /**
     * RoomAuditService.findOne
     */
    
    test(`(${name}) - RoomAuditService.findOne valid partitions`, async () => {
        const audits = await RoomAuditService.findAll({ room_uuid, user: admin, limit: 1 });
        expect(audits.data.length).toBeGreaterThan(0);
        const result = await RoomAuditService.findOne({ uuid: audits.data[0].uuid, user: admin });

        expect(result).toHaveProperty('uuid');
        expect(result).toHaveProperty('body');
        expect(result).toHaveProperty('room_audit_type_name');
        expect(result).toHaveProperty('room_uuid');
        expect(result).toHaveProperty('created_at');
        expect(result).toHaveProperty('updated_at');
    });

    test.each([
        [null, 'Invalid options provided'],
        ["", 'Invalid options provided'],
        [1, 'Invalid options provided'],
        [0, 'Invalid options provided'],
        [[], 'Invalid options provided'],
        [{}, 'No uuid provided'],
        [{ uuid: "test" }, 'No user provided'],
        [{ uuid: "test", user: { } }, 'No user.sub provided'],
        [{ uuid: "test", user: { sub: "test" } }, 'room_audit not found'],
    ])(`(${name}) - RoomAuditService.findOne invalid partitions`, async (options, expected) => {
        expect(async () => await RoomAuditService.findOne(options)).rejects.toThrowError(expected);
    });

    

    /**
     * Security Checks
     */

    test.each([
        [user],
    ])(`(${name}) - RoomAuditService.findOne return error for users who are not member`, async (user) => {
        const audits = await RoomAuditService.findAll({ room_uuid, user: admin, limit: 1 });
        expect(async () => await RoomAuditService.findOne({ user, uuid: audits.data[0].uuid }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [user],
    ])(`(${name}) - RoomAuditService.findAll return error for users who are not member`, async (user) => {
        expect(async () => await RoomAuditService.findAll({ room_uuid, user }))
            .rejects.toThrow("User is not in the room");
    });
};

roomAuditServiceTest(RelationalRoomAuditService, 'Relational');
//roomAuditServiceTest(DocumentRoomAuditService, 'Document');
//roomAuditServiceTest(GraphRoomAuditService, 'Graph');
