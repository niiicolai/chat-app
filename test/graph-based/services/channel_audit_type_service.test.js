import ChannelAuditTypeService from '../../../src/graph-based/services/channel_audit_type_service.js';
import { test, expect } from 'vitest';

test.each([
    [ 'MESSAGE_CREATED' ],
    [ 'MESSAGE_EDITED' ],
    [ 'MESSAGE_DELETED' ],
    [ 'WEBHOOK_CREATED' ],
    [ 'WEBHOOK_DELETED' ],
    [ 'WEBHOOK_EDITED' ],
])('ChannelAuditTypeService.findOne valid partitions', async (name) => {
    const result = await ChannelAuditTypeService.findOne({ name });

    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('created_at');
    expect(result).toHaveProperty('updated_at');
    expect(result.name).toBe(name);
});

test.each([
    [ null, 'Invalid options provided' ],
    [ "", 'Invalid options provided' ],
    [ 1, 'Invalid options provided' ],
    [ 0, 'Invalid options provided' ],
    [ [], 'Invalid options provided' ],
    [ {}, 'name is required' ],
    [ { name: '' }, 'name is required' ],
    [ { name: 0 }, 'name is required' ],
    [ { name: 1 }, 'ChannelAuditType not found' ],
    [ { name: "test" }, 'ChannelAuditType not found' ],
])('ChannelAuditTypeService.findOne invalid partitions', async (options, expected) => {
    expect(() => ChannelAuditTypeService.findOne(options)).rejects.toThrowError(expected);
});

test.each([
    [ undefined ],
    [ {} ],
    [ { limit: 6 } ],
    [ { limit: 2 } ],
    [ { limit: 1 } ],
    [ { limit: 6, page: 1 } ],
    [ { limit: 3, page: 2 } ],
    [ { limit: 2, page: 3 } ],
    [ { limit: 1, page: 4 } ],
    [ { limit: 1, page: 5 } ],
    [ { limit: 1, page: 6 } ],
])('ChannelAuditTypeService.findAll valid partitions', async (options) => {
    const result = await ChannelAuditTypeService.findAll(options);

    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('data');

    expect(result.total).toBe(6);
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
    [ null, 'Invalid options provided' ],
    [ "", 'Invalid options provided' ],
    [ 1, 'Invalid options provided' ],
    [ 0, 'Invalid options provided' ],
    [ [], 'Invalid options provided' ],
    [ { page: 1 }, 'page requires limit' ],
    [ { page: -1 }, 'page must be greater than 0' ],
    [ { page: "test" }, 'page must be a number' ],
    [ { page: 1, limit: -1 }, 'limit must be greater than 0' ],
    [ { page: 1, limit: "test" }, 'limit must be a number' ],
])('ChannelAuditTypeService.findAll invalid partitions', async (options, expected) => {
    expect(() => ChannelAuditTypeService.findAll(options)).rejects.toThrowError(expected);
});
