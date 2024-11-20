import UserEmailVerificationService from '../../../src/graph-based/services/user_email_verification_service.js';
import { test, describe, expect } from 'vitest';
import { context } from '../../context.js';

describe('UserEmailVerificationService Tests', async () => {

    test.each([
        [ undefined, 'No user_uuid provided' ],
        [ null, 'No options provided' ],
        [ {}, 'No user_uuid provided' ],
        [ [], 'No user_uuid provided' ],
        [ { email: null }, 'No user_uuid provided' ],
        [ { test: null }, 'No user_uuid provided' ],
        [ { user_uuid: context.admin.sub }, 'User email already verified' ],
        [ { user_uuid: context.mod.sub }, 'User email already verified' ],
        [ { user_uuid: context.member.sub }, 'User email already verified' ],
    ])('UserEmailVerificationService.resend invalid partitions', async (options, expected) => {
        expect(() => UserEmailVerificationService.resend(options)).rejects.toThrowError(expected);
    });

    test.each([
        [ undefined, 'No uuid provided' ],
        [ null, 'No options provided' ],
        [ {}, 'No uuid provided' ],
        [ [], 'No uuid provided' ],
        [ { email: null }, 'No uuid provided' ],
        [ { test: null }, 'No uuid provided' ],
        [ { uuid: "test" }, 'User email verification not found. Ensure the link is correct.' ],
    ])('UserEmailVerificationService.confirm invalid partitions', async (options, expected) => {
        expect(() => UserEmailVerificationService.confirm(options)).rejects.toThrowError(expected);
    });

});