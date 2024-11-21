import RelationalChannelAuditTypeService from '../../src/relational-based/services/channel_audit_type_service.js';
import DocumentChannelAuditTypeService from '../../src/document-based/services/channel_audit_type_service.js';
import GraphChannelAuditTypeService from '../../src/graph-based/services/channel_audit_type_service.js';
import { test, expect } from 'vitest';

const channelAuditTypeServiceTest = (ChannelAuditTypeService, name) => {

    test(`(${name}) - ChannelAuditTypeService must implement expected methods`, () => {
        expect(ChannelAuditTypeService).toHaveProperty('findOne');
        expect(ChannelAuditTypeService).toHaveProperty('findAll');
    });

    test.each([
        ['CHANNEL_CREATED'],
        ['CHANNEL_EDITED'],
        ['CHANNEL_DELETED'],
        ['MESSAGE_CREATED'],
        ['MESSAGE_EDITED'],
        ['MESSAGE_DELETED'],
        ['WEBHOOK_CREATED'],
        ['WEBHOOK_DELETED'],
        ['WEBHOOK_EDITED'],
    ])(`(${name}) - ChannelAuditTypeService.findOne valid partitions`, async (name) => {
        const result = await ChannelAuditTypeService.findOne({ name });

        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('created_at');
        expect(result).toHaveProperty('updated_at');
        expect(result.name).toBe(name);
    });

    test.each([
        [null, 'Invalid options provided'],
        ["", 'Invalid options provided'],
        [1, 'Invalid options provided'],
        [0, 'Invalid options provided'],
        [[], 'Invalid options provided'],
        [{}, 'name is required'],
        [{ name: '' }, 'name is required'],
        [{ name: 0 }, 'name is required'],
        [{ name: 1 }, 'channel_audit_type not found'],
        [{ name: "test" }, 'channel_audit_type not found'],
    ])(`(${name}) - ChannelAuditTypeService.findOne invalid partitions`, async (options, expected) => {
        expect(() => ChannelAuditTypeService.findOne(options)).rejects.toThrowError(expected);
    });

    test.each([
        [undefined],
        [{}],
        [{ limit: 6 }],
        [{ limit: 2 }],
        [{ limit: 1 }],
        [{ limit: 6, page: 1 }],
        [{ limit: 3, page: 2 }],
        [{ limit: 2, page: 3 }],
        [{ limit: 1, page: 4 }],
        [{ limit: 1, page: 5 }],
        [{ limit: 1, page: 6 }],
    ])(`(${name}) - ChannelAuditTypeService.findAll valid partitions`, async (options) => {
        const result = await ChannelAuditTypeService.findAll(options);

        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('data');

        expect(result.total).toBe(9);
        expect(result.data[0]).toHaveProperty('name');
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
        [{ page: 1 }, 'page requires limit'],
        [{ page: -1 }, 'page must be greater than 0'],
        [{ page: "test" }, 'page must be a number'],
        [{ page: 1, limit: -1 }, 'limit must be greater than 0'],
        [{ page: 1, limit: "test" }, 'limit must be a number'],
    ])(`(${name}) - ChannelAuditTypeService.findAll invalid partitions`, async (options, expected) => {
        expect(() => ChannelAuditTypeService.findAll(options)).rejects.toThrowError(expected);
    });
};

channelAuditTypeServiceTest(RelationalChannelAuditTypeService, 'Relational');
channelAuditTypeServiceTest(DocumentChannelAuditTypeService, 'Document');
channelAuditTypeServiceTest(GraphChannelAuditTypeService, 'Graph');
