import UserStatusStateService from '../../../src/document-based/services/user_status_state_service.js';
import { test, expect } from 'vitest';

test.each([
    [ 'Online' ],
    [ 'Away' ],
    [ 'Do Not Disturb' ],
    [ 'Offline' ],
])('UserStatusStateService.findOne valid partitions', async (name) => {
    const result = await UserStatusStateService.findOne({ name });

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
    [ { name: 1 }, 'name must be a string' ],
    [ { name: "test" }, 'UserStatusState not found' ],
])('UserStatusStateService.findOne invalid partitions', async (options, expected) => {
    expect(() => UserStatusStateService.findOne(options)).rejects.toThrowError(expected);
});

test.each([
    [ undefined ],
    [ {} ],
    [ { limit: 2 } ],
    [ { limit: 1 } ],
    [ { limit: 2, page: 1 } ],
    [ { limit: 1, page: 2 } ],
])('UserStatusStateService.findAll valid partitions', async (options) => {
    const result = await UserStatusStateService.findAll(options);

    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('data');

    expect(result.total).toBe(4);
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
])('UserStatusStateService.findAll invalid partitions', async (options, expected) => {
    expect(() => UserStatusStateService.findAll(options)).rejects.toThrowError(expected);
});
