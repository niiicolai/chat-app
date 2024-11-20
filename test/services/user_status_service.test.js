import RelationalUserStatusService from '../../src/relational-based/services/user_status_service.js';
import DocumentUserStatusService from '../../src/document-based/services/user_status_service.js';
import GraphUserStatusService from '../../src/graph-based/services/user_status_service.js';
import { test, expect } from 'vitest';
import { context } from '../context.js';

const userStatusServiceTest = (UserStatusService, name) => {

    test(`(${name}) - UserStatusService must implement expected methods`, () => {
        expect(UserStatusService).toHaveProperty('findOne');
        expect(UserStatusService).toHaveProperty('update');
    });

    test.each([
        [{ user_uuid: context.admin.sub }],
        [{ user_uuid: context.mod.sub }],
        [{ user_uuid: context.member.sub }],
    ])(`(${name}) - UserStatusService.findOne valid partitions`, async (options) => {
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
        [undefined, 'No user_uuid provided'],
        [null, 'No options provided'],
        [{}, 'No user_uuid provided'],
        [[], 'No user_uuid provided'],
        [{ user_uuid: 'test' }, 'User status not found'],
    ])(`(${name}) - UserStatusService.findOne invalid partitions`, async (options, expected) => {
        expect(() => UserStatusService.findOne(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ body: { message: 'new msg', user_status_state: 'Away' }, user_uuid: context.admin.sub }],
        [{ body: { message: 'new msg', user_status_state: 'Online' }, user_uuid: context.mod.sub }],
        [{ body: { message: 'new msg', user_status_state: 'Offline' }, user_uuid: context.member.sub }],
    ])(`(${name}) - UserStatusService.update valid partitions`, async (options) => {
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
        [undefined, 'No user_uuid provided'],
        [null, 'No options provided'],
        [{}, 'No user_uuid provided'],
        [[], 'No user_uuid provided'],
        [{ user_uuid: undefined }, 'No user_uuid provided'],
        [{ user_uuid: null }, 'No user_uuid provided'],
        [{ user_uuid: 'test' }, 'User status not found'],
    ])(`(${name}) - UserStatusService.update invalid partitions`, async (options, expected) => {
        expect(() => UserStatusService.findOne(options)).rejects.toThrowError(expected);
    });
};

userStatusServiceTest(RelationalUserStatusService, 'Relational');
userStatusServiceTest(DocumentUserStatusService, 'Document');
userStatusServiceTest(GraphUserStatusService, 'Graph');
