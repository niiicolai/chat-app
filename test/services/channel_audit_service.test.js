import RelationalChannelAuditService from '../../src/relational-based/services/channel_audit_service.js';
import DocumentChannelAuditService from '../../src/document-based/services/channel_audit_service.js';
import GraphChannelAuditService from '../../src/graph-based/services/channel_audit_service.js';

import data from '../../src/seed_data.js';
import { test, expect } from 'vitest';

const channelAuditServiceTest = (ChannelAuditService, name) => {

    /**
     * Existing users, rooms and channels
     */

    const user = { sub: data.users.find(u => u.username === 'not_in_a_room').uuid };
    const channel_uuid = data.rooms[0].channels[0].uuid;
    const admin = { sub: data.users[0].uuid };
    const fakeUuid = 'c4986be6-5ac5-414c-a7eb-eacd7f4dc54e';



    /**
     * Expected methods
     */

    test(`(${name}) - ChannelAuditService must implement expected methods`, () => {
        expect(ChannelAuditService).toHaveProperty('findOne');
        expect(ChannelAuditService).toHaveProperty('findAll');
    });



    /**
     * ChannelAuditService.findAll
     */

    test.each([
        [{ channel_uuid, user: admin, limit: 2 }],
        [{ channel_uuid, user: admin, limit: 1 }],
        [{ channel_uuid, user: admin, limit: 2, page: 1 }],
    ])(`(${name}) - ChannelAuditService.findAll valid partitions`, async (options) => {
        const result = await ChannelAuditService.findAll(options);

        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('data');

        expect(result.data[0]).toHaveProperty('uuid');
        expect(result.data[0]).toHaveProperty('body');
        expect(result.data[0]).toHaveProperty('channel_audit_type_name');
        expect(result.data[0]).toHaveProperty('channel_uuid');
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
        [{ page: 1 }, 'No channel_uuid provided'],
        [{ channel_uuid: fakeUuid }, 'No user provided'],
        [{ channel_uuid: fakeUuid, user: {}, page: 1 }, 'No user.sub provided'],
        [{ channel_uuid: fakeUuid, user: { sub: fakeUuid }, page: 1 }, 'page requires limit'],
        [{ channel_uuid: fakeUuid, user: { sub: fakeUuid }, page: -1 }, 'page must be greater than 0'],
        [{ channel_uuid: fakeUuid, user: { sub: fakeUuid }, page: "test" }, 'page must be a number'],
        [{ channel_uuid: fakeUuid, user: { sub: fakeUuid }, page: 1, limit: -1 }, 'limit must be greater than 0'],
        [{ channel_uuid: fakeUuid, user: { sub: fakeUuid }, page: 1, limit: "test" }, 'limit must be a number'],
    ])(`(${name}) - ChannelAuditService.findAll invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelAuditService.findAll(options)).rejects.toThrowError(expected);
    });



    /**
     * ChannelAuditService.findOne
     */
    
    test(`(${name}) - ChannelAuditService.findOne valid partitions`, async () => {
        const audits = await ChannelAuditService.findAll({ channel_uuid, user: admin, limit: 1 });
        expect(audits.data.length).toBeGreaterThan(0);
        const result = await ChannelAuditService.findOne({ uuid: audits.data[0].uuid, user: admin });


        expect(result).toHaveProperty('uuid');
        expect(result).toHaveProperty('body');
        expect(result).toHaveProperty('channel_audit_type_name');
        expect(result).toHaveProperty('channel_uuid');
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
        [{ uuid: fakeUuid }, 'No user provided'],
        [{ uuid: fakeUuid, user: { } }, 'No user.sub provided'],
        [{ uuid: fakeUuid, user: { sub: fakeUuid } }, 'channel_audit not found'],
    ])(`(${name}) - ChannelAuditService.findOne invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelAuditService.findOne(options)).rejects.toThrowError(expected);
    });


    
    /**
     * Security Checks
     */

    test.each([
        [user],
    ])(`(${name}) - ChannelAuditService.findOne return error for users who are not member`, async (user) => {
        const audits = await ChannelAuditService.findAll({ channel_uuid, user: admin, limit: 1 });
        expect(audits.data.length).toBeGreaterThan(0);
        expect(async () => await ChannelAuditService.findOne({ user, uuid: audits.data[0].uuid }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [user],
    ])(`(${name}) - ChannelAuditService.findAll return error for users who are not member`, async (user) => {
        expect(async () => await ChannelAuditService.findAll({ channel_uuid, user }))
            .rejects.toThrow("User is not in the room");
    });
};

channelAuditServiceTest(RelationalChannelAuditService, 'Relational');
channelAuditServiceTest(DocumentChannelAuditService, 'Document');
//channelAuditServiceTest(GraphChannelAuditService, 'Graph');
