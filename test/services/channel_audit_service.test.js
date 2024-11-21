import RelationalChannelAuditService from '../../src/relational-based/services/channel_audit_service.js';
import DocumentChannelAuditService from '../../src/document-based/services/channel_audit_service.js';
import GraphChannelAuditService from '../../src/graph-based/services/channel_audit_service.js';
import { context } from '../context.js';
import { test, expect } from 'vitest';

const channelAuditServiceTest = (ChannelAuditService, name) => {

    test(`(${name}) - ChannelAuditService must implement expected methods`, () => {
        expect(ChannelAuditService).toHaveProperty('findOne');
        expect(ChannelAuditService).toHaveProperty('findAll');
    });

    test.each([
        [{ channel_uuid: context.channel.uuid, user: context.admin, limit: 2 }],
        [{ channel_uuid: context.channel.uuid, user: context.admin, limit: 1 }],
        [{ channel_uuid: context.channel.uuid, user: context.admin, limit: 2, page: 1 }],
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
        [{ channel_uuid: "test" }, 'No user provided'],
        [{ channel_uuid: "test", user: {}, page: 1 }, 'No user.sub provided'],
        [{ channel_uuid: "test", user: { sub: "test" }, page: 1 }, 'page requires limit'],
        [{ channel_uuid: "test", user: { sub: "test" }, page: -1 }, 'page must be greater than 0'],
        [{ channel_uuid: "test", user: { sub: "test" }, page: "test" }, 'page must be a number'],
        [{ channel_uuid: "test", user: { sub: "test" }, page: 1, limit: -1 }, 'limit must be greater than 0'],
        [{ channel_uuid: "test", user: { sub: "test" }, page: 1, limit: "test" }, 'limit must be a number'],
    ])(`(${name}) - ChannelAuditService.findAll invalid partitions`, async (options, expected) => {
        expect(() => ChannelAuditService.findAll(options)).rejects.toThrowError(expected);
    });
    
    test(`(${name}) - ChannelAuditService.findOne valid partitions`, async () => {
        const audits = await ChannelAuditService.findAll({ channel_uuid: context.channel.uuid, user: context.admin, limit: 1 });
        expect(audits.data.length).toBeGreaterThan(0);
        const result = await ChannelAuditService.findOne({ uuid: audits.data[0].uuid, user: context.admin });

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
        [{ uuid: "test" }, 'No user provided'],
        [{ uuid: "test", user: { } }, 'No user.sub provided'],
        [{ uuid: "test", user: { sub: "test" } }, 'channel_audit not found'],
    ])(`(${name}) - ChannelAuditService.findOne invalid partitions`, async (options, expected) => {
        expect(() => ChannelAuditService.findOne(options)).rejects.toThrowError(expected);
    });
};

channelAuditServiceTest(RelationalChannelAuditService, 'Relational');
channelAuditServiceTest(DocumentChannelAuditService, 'Document');
channelAuditServiceTest(GraphChannelAuditService, 'Graph');
