import RelationalUserPasswordResetService from '../../src/relational-based/services/user_password_reset_service.js';
import DocumentUserPasswordResetService from '../../src/document-based/services/user_password_reset_service.js';
import GraphUserPasswordResetService from '../../src/graph-based/services/user_password_reset_service.js';

import data from '../../src/seed_data.js';
import { test, expect } from 'vitest';

const userPasswordResetServiceTest = (UserPasswordResetService, name) => {
    const admin = { ...data.users[0] };
    const mod = { ...data.users[1] };
    const member = { ...data.users[2] };

    test(`(${name}) - UserPasswordResetService must implement expected methods`, () => {
        expect(UserPasswordResetService).toHaveProperty('create');
        expect(UserPasswordResetService).toHaveProperty('resetPassword');
    });

    test.each([
        [{ body: { email: `test@example.com` } }],
        [{ body: { email: admin.email } }],
        [{ body: { email: mod.email } }],
        [{ body: { email: member.email } }],
    ])(`(${name}) - UserPasswordResetService.create valid partitions`, async (options) => {
        await UserPasswordResetService.create(options);
    });

    test.each([
        [ undefined, 'No body provided' ],
        [ null, 'No options provided' ],
        [ {}, 'No body provided' ],
        [ [], 'No body provided' ],
        [ { email: null }, 'No body provided' ],
        [ { test: null }, 'No body provided' ],
    ])(`(${name}) - UserPasswordResetService.create invalid partitions`, async (options, expected) => {
        expect(async () => await UserPasswordResetService.create(options)).rejects.toThrowError(expected);
    });

    test.each([
        [ undefined, 'No uuid provided' ],
        [ null, 'No options provided' ],
        [ {}, 'No uuid provided' ],
        [ [], 'No uuid provided' ],
        [ { email: null }, 'No uuid provided' ],
        [ { test: null }, 'No uuid provided' ],
        [ { uuid: "test" }, 'No body provided' ],
        [ { uuid: "test", body: null }, 'No body provided' ],
    ])(`(${name}) - UserPasswordResetService.resetPassword invalid partitions`, async (options, expected) => {
        expect(async () => await UserPasswordResetService.resetPassword(options)).rejects.toThrowError(expected);
    });
};

userPasswordResetServiceTest(RelationalUserPasswordResetService, 'Relational');
/*
userPasswordResetServiceTest(DocumentUserPasswordResetService, 'Document');
userPasswordResetServiceTest(GraphUserPasswordResetService, 'Graph');
*/