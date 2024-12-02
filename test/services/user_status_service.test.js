import RelationalUserStatusService from '../../src/relational-based/services/user_status_service.js';
import DocumentUserStatusService from '../../src/document-based/services/user_status_service.js';
import GraphUserStatusService from '../../src/graph-based/services/user_status_service.js';

import data from '../../src/seed_data.js';
import { test, expect } from 'vitest';

const userStatusServiceTest = (UserStatusService, name) => {

    /**
     * Exisiting entities
     */

    const admin = { sub: data.users[0].uuid };
    const mod = { sub: data.users[1].uuid };
    const member = { sub: data.users[2].uuid };



    /**
     * Expected methods
     */

    test(`(${name}) - UserStatusService must implement expected methods`, () => {
        expect(UserStatusService).toHaveProperty('findOne');
        expect(UserStatusService).toHaveProperty('update');
    });



    /**
     * UserStatusService.findOne
     */

    test.each([
        [{ user_uuid: admin.sub }],
        [{ user_uuid: mod.sub }],
        [{ user_uuid: member.sub }],
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
        [{ user_uuid: 'test' }, 'user_status not found'],
    ])(`(${name}) - UserStatusService.findOne invalid partitions`, async (options, expected) => {
        expect(async () => await UserStatusService.findOne(options)).rejects.toThrowError(expected);
    });



    /**
     * UserStatusService.update
     */

    test.each([
        [{ body: { message: 'new msg', user_status_state: 'Away' }, user_uuid: admin.sub }],
        [{ body: { message: 'new msg', user_status_state: 'Online' }, user_uuid: mod.sub }],
        [{ body: { message: 'new msg', user_status_state: 'Offline' }, user_uuid: member.sub }],
    ])(`(${name}) - UserStatusService.update valid partitions`, async (options) => {
        const result = await UserStatusService.update(options);

        expect(result).toHaveProperty('uuid');
        expect(result).toHaveProperty('last_seen_at');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('total_online_hours');
        expect(result).toHaveProperty('user_status_state_name');
        expect(result).toHaveProperty('user_uuid');
        expect(result.user_uuid).toBe(options.user_uuid);
        expect(result.message).toBe(options.body.message);
        expect(result.user_status_state_name).toBe(options.body.user_status_state);
    });

    test.each([
        [undefined, 'No user_uuid provided'],
        [null, 'No options provided'],
        [{}, 'No user_uuid provided'],
        [[], 'No user_uuid provided'],
        [{ user_uuid: undefined }, 'No user_uuid provided'],
        [{ user_uuid: null }, 'No user_uuid provided'],
        [{ user_uuid: 'test' }, 'user_status not found'],
    ])(`(${name}) - UserStatusService.update invalid partitions`, async (options, expected) => {
        expect(async () => await UserStatusService.findOne(options)).rejects.toThrowError(expected);
    });
};

userStatusServiceTest(RelationalUserStatusService, 'Relational');
//userStatusServiceTest(DocumentUserStatusService, 'Document');
//userStatusServiceTest(GraphUserStatusService, 'Graph');

