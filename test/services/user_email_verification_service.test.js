import RelationalUserEmailVerificationService from '../../src/relational-based/services/user_email_verification_service.js';
import RelationalUserService from '../../src/relational-based/services/user_service.js';

import DocumentUserEmailVerificationService from '../../src/document-based/services/user_email_verification_service.js';
import DocumentUserService from '../../src/document-based/services/user_service.js';

import GraphUserEmailVerificationService from '../../src/graph-based/services/user_email_verification_service.js';
import GraphUserService from '../../src/graph-based/services/user_service.js';

import data from '../../src/seed_data.js';
import { test, expect, beforeAll, afterAll } from 'vitest';
import { v4 as v4uuid } from 'uuid';

const userEmailVerificationServiceTest = (UserEmailVerificationService, UserService, name) => {

    /**
     * New entities
     */

    const admin = { sub: data.users[0].uuid };
    const mod = { sub: data.users[1].uuid };
    const member = { sub: data.users[2].uuid };




    /**
     * New entities
     */

    const user = {
        uuid: v4uuid(),
        username: 'email_verification_user',
        email: 'email_verification_user@localhost.com',
        password: '12345678'
    }



    /**
     * Fake entities
     */

    const fakeId = '1635e897-b84b-4b98-b8cf-5471ff349022';



    /**
     * Setup
     */

    beforeAll(async () => {
        const disableVerifyInTest = true;
        await UserService.create({ body: user }, disableVerifyInTest);
    });



    /**
     * Teardown
     */

    afterAll(async () => {
        await UserService.destroy({ uuid: user.uuid });
    });



    /**
     * Expected methods
     */

    test(`(${name}) - UserEmailVerificationService must implement expected methods`, () => {
        expect(UserEmailVerificationService).toHaveProperty('resend');
        expect(UserEmailVerificationService).toHaveProperty('confirm');
    });



    /**
     * UserEmailVerificationService.resend
     */

    test.each([
        [ { user_uuid: user.uuid } ],
    ])(`(${name}) - UserEmailVerificationService.resend valid partitions`, async (options) => {
        await UserEmailVerificationService.resend(options);
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



    /**
     * UserEmailVerificationService.confirm
     */

    test.each([
        [ { user_uuid: user.uuid } ],
    ])(`(${name}) - UserEmailVerificationService.confirm valid partitions`, async (options) => {
        const { uuid, is_verified: before } = await UserService.getUserEmailVerification({ uuid: user.uuid });
        expect(uuid).toBeDefined();
        expect(before).toBe(false);
        await UserEmailVerificationService.confirm({ uuid });

        // Verify the email is confirmed
        const { is_verified: after } = await UserService.getUserEmailVerification({ uuid: user.uuid });
        expect(after).toBe(true);
    });

    test.each([
        [ undefined, 'No uuid provided' ],
        [ null, 'No options provided' ],
        [ {}, 'No uuid provided' ],
        [ [], 'No uuid provided' ],
        [ { email: null }, 'No uuid provided' ],
        [ { test: null }, 'No uuid provided' ],
        [ { uuid: fakeId }, 'user_email_verification not found' ],
    ])(`(${name}) - UserEmailVerificationService.confirm invalid partitions`, async (options, expected) => {
        expect(async () => await UserEmailVerificationService.confirm(options)).rejects.toThrowError(expected);
    });
};

//userEmailVerificationServiceTest(RelationalUserEmailVerificationService, RelationalUserService, 'Relational');
userEmailVerificationServiceTest(DocumentUserEmailVerificationService, DocumentUserService, 'Document');
//userEmailVerificationServiceTest(GraphUserEmailVerificationService, GraphUserService, 'Graph');

