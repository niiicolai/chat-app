import RelationalUserEmailVerificationService from '../../src/relational-based/services/user_email_verification_service.js';
import DocumentUserEmailVerificationService from '../../src/document-based/services/user_email_verification_service.js';
import GraphUserEmailVerificationService from '../../src/graph-based/services/user_email_verification_service.js';

import data from '../../src/seed_data.js';
import { test, expect } from 'vitest';

const userEmailVerificationServiceTest = (UserEmailVerificationService, name) => {
    const admin = { sub: data.users[0].uuid };
    const mod = { sub: data.users[1].uuid };
    const member = { sub: data.users[2].uuid };

    test(`(${name}) - UserEmailVerificationService must implement expected methods`, () => {
        expect(UserEmailVerificationService).toHaveProperty('resend');
        expect(UserEmailVerificationService).toHaveProperty('confirm');
    });

    test.each([
        [ undefined, 'No user_uuid provided' ],
        [ null, 'No options provided' ],
        [ {}, 'No user_uuid provided' ],
        [ [], 'No user_uuid provided' ],
        [ { email: null }, 'No user_uuid provided' ],
        [ { test: null }, 'No user_uuid provided' ],
        [ { user_uuid: admin.sub }, 'User email already verified' ],
        [ { user_uuid: mod.sub }, 'User email already verified' ],
        [ { user_uuid: member.sub }, 'User email already verified' ],
    ])(`(${name}) - UserEmailVerificationService.resend invalid partitions`, async (options, expected) => {
        expect(async () => await UserEmailVerificationService.resend(options)).rejects.toThrowError(expected);
    });


    test.each([
        [ undefined, 'No uuid provided' ],
        [ null, 'No options provided' ],
        [ {}, 'No uuid provided' ],
        [ [], 'No uuid provided' ],
        [ { email: null }, 'No uuid provided' ],
        [ { test: null }, 'No uuid provided' ],
        [ { uuid: "test" }, 'user_email_verification not found' ],
    ])(`(${name}) - UserEmailVerificationService.confirm invalid partitions`, async (options, expected) => {
        expect(async () => await UserEmailVerificationService.confirm(options)).rejects.toThrowError(expected);
    });
};

userEmailVerificationServiceTest(RelationalUserEmailVerificationService, 'Relational');
/*
userEmailVerificationServiceTest(DocumentUserEmailVerificationService, 'Document');
userEmailVerificationServiceTest(GraphUserEmailVerificationService, 'Graph');
*/
