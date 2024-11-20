import UserStatusService from '../../../src/relational-based/services/user_status_service.js';
import { test, expect, describe } from 'vitest';
import { context } from '../../context.js';

describe('UserStatusService Tests', () => {

    test.each([
        [{ user_uuid: context.admin.sub }],
        [{ user_uuid: context.mod.sub }],
        [{ user_uuid: context.member.sub }],
    ])('UserStatusService.findOne valid partitions', async (options) => {
        const result = await UserStatusService.findOne(options);

        expect(result).toHaveProperty('uuid');
        expect(result).toHaveProperty('last_seen_at');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('total_online_hours');
        expect(result).toHaveProperty('user_status_state_name');
        expect(result).toHaveProperty('user_uuid');
        expect(result.user_uuid).toBe(options.user_uuid);
    });

    test.each([
        [ undefined, 'No user_uuid provided' ],
        [ null, 'No options provided' ],
        [ {}, 'No user_uuid provided' ],
        [ [], 'No user_uuid provided' ],
        [ { user_uuid: 'test' }, 'User status not found' ],
    ])('UserStatusService.findOne invalid partitions', async (options, expected) => {
        expect(() => UserStatusService.findOne(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ body: { message: 'new msg', user_status_state: 'Away' }, user_uuid: context.admin.sub }],
        [{ body: { message: 'new msg', user_status_state: 'Online' }, user_uuid: context.mod.sub }],
        [{ body: { message: 'new msg', user_status_state: 'Offline' }, user_uuid: context.member.sub }],
    ])('UserStatusService.update valid partitions', async (options) => {
        const result = await UserStatusService.update(options);

        expect(result).toHaveProperty('uuid');
        expect(result).toHaveProperty('last_seen_at');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('total_online_hours');
        expect(result).toHaveProperty('user_status_state_name');
        expect(result).toHaveProperty('user_uuid');
        expect(result.user_uuid).toBe(options.user_uuid);
    });

    test.each([
        [ undefined, 'No user_uuid provided' ],
        [ null, 'No options provided' ],
        [ {}, 'No user_uuid provided' ],
        [ [], 'No user_uuid provided' ],
        [ { user_uuid: undefined }, 'No user_uuid provided' ],
        [ { user_uuid: null }, 'No user_uuid provided' ],
        [ { user_uuid: 'test' }, 'User status not found' ],
    ])('UserStatusService.update invalid partitions', async (options, expected) => {
        expect(() => UserStatusService.findOne(options)).rejects.toThrowError(expected);
    });

});
