import RelationalUserPasswordResetService from '../../src/relational-based/services/user_password_reset_service.js';
import DocumentUserPasswordResetService from '../../src/document-based/services/user_password_reset_service.js';
import GraphUserPasswordResetService from '../../src/graph-based/services/user_password_reset_service.js';
import { test, expect } from 'vitest';
import { context } from '../context.js';
import { v4 as uuidv4 } from 'uuid';

const userPasswordResetServiceTest = (UserPasswordResetService, name) => {

    test(`(${name}) - UserPasswordResetService must implement expected methods`, () => {
        expect(UserPasswordResetService).toHaveProperty('create');
        expect(UserPasswordResetService).toHaveProperty('resetPassword');
    });

    test.each([
        [{ body: { email: `test-${uuidv4()}@example.com` } }],
        [{ body: { email: context.admin.email } }],
        [{ body: { email: context.mod.email } }],
        [{ body: { email: context.member.email } }],
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
userPasswordResetServiceTest(DocumentUserPasswordResetService, 'Document');
userPasswordResetServiceTest(GraphUserPasswordResetService, 'Graph');
