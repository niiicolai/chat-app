import UserPasswordResetService from '../../../src/relational-based/services/user_password_reset_service.js';
import { test, describe, expect } from 'vitest';
import { context } from '../../context.js';

describe('UserPasswordResetService Tests', () => {

    test.each([
        [{ body: { email: "test" } }],
        [{ body: { email: context.admin.email } }],
        [{ body: { email: context.mod.email } }],
        [{ body: { email: context.member.email } }],
    ])('UserPasswordResetService.create valid partitions', async (options) => {
        await UserPasswordResetService.create(options);
    });

    test.each([
        [ undefined, 'No body provided' ],
        [ null, 'No options provided' ],
        [ {}, 'No body provided' ],
        [ [], 'No body provided' ],
        [ { email: null }, 'No body provided' ],
        [ { test: null }, 'No body provided' ],
    ])('UserPasswordResetService.create invalid partitions', async (options, expected) => {
        expect(() => UserPasswordResetService.create(options)).rejects.toThrowError(expected);
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
    ])('UserPasswordResetService.resetPassword invalid partitions', async (options, expected) => {
        expect(() => UserPasswordResetService.resetPassword(options)).rejects.toThrowError(expected);
    });

});