import RoomAuditTypeService from '../../../src/relational-based/services/room_audit_type_service.js';
import { test, expect } from 'vitest';

test.each([
    [ 'ROOM_CREATED' ],
    [ 'ROOM_EDITED' ],
    [ 'ROOM_DELETED' ],
    [ 'JOIN_SETTING_EDITED' ],
    [ 'INVITE_LINK_CREATED' ],
    [ 'INVITE_LINK_EDITED' ],
    [ 'INVITE_LINK_DELETED' ],
    [ 'USER_ADDED' ],
    [ 'USER_REMOVED' ],
    [ 'FILE_CREATED' ],
    [ 'FILE_DELETED' ],
    [ 'AVATAR_CREATED' ],
    [ 'AVATAR_EDITED' ],
    [ 'AVATAR_DELETED' ],
    [ 'CHANNEL_CREATED' ],
    [ 'CHANNEL_EDITED' ],
    [ 'CHANNEL_DELETED' ],
])('RoomAuditTypeService.findOne valid partitions', async (name) => {
    const result = await RoomAuditTypeService.findOne({ name });

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
    [ { name: 1 }, 'room_audit_type not found' ],
    [ { name: "test" }, 'room_audit_type not found' ],
])('RoomAuditTypeService.findOne invalid partitions', async (options, expected) => {
    expect(() => RoomAuditTypeService.findOne(options)).rejects.toThrowError(expected);
});

test.each([
    [ undefined ],
    [ {} ],
    [ { limit: 2 } ],
    [ { limit: 1 } ],
    [ { limit: 2, page: 1 } ],
    [ { limit: 1, page: 2 } ],
])('RoomAuditTypeService.findAll valid partitions', async (options) => {
    const result = await RoomAuditTypeService.findAll(options);

    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('data');

    expect(result.total).toBe(17);
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
])('RoomAuditTypeService.findAll invalid partitions', async (options, expected) => {
    expect(() => RoomAuditTypeService.findAll(options)).rejects.toThrowError(expected);
});
