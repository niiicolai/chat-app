import RelationalUserPasswordResetService from '../../src/relational-based/services/user_password_reset_service.js';
import RelationalUserService from '../../src/relational-based/services/user_service.js';

import DocumentUserPasswordResetService from '../../src/document-based/services/user_password_reset_service.js';
import DocumentUserService from '../../src/document-based/services/user_service.js';

import GraphUserPasswordResetService from '../../src/graph-based/services/user_password_reset_service.js';
import GraphUserService from '../../src/graph-based/services/user_service.js';

import data from '../../src/seed_data.js';
import { test, expect } from 'vitest';
import { v4 as v4uuid } from 'uuid';

const userPasswordResetServiceTest = (UserPasswordResetService, UserService, name) => {

    /**
     * Exisiting entities
     */

    const user = { ...data.users.find(u => u.username === 'pass_reset_user') };



    /**
     * New entities
     */
    
    const userResetUuid = v4uuid();
    const userRandomPass = v4uuid();



    /**
     * Expected methods
     */

    test(`(${name}) - UserPasswordResetService must implement expected methods`, () => {
        expect(UserPasswordResetService).toHaveProperty('create');
        expect(UserPasswordResetService).toHaveProperty('resetPassword');
    });



    /**
     * UserPasswordResetService.create
     */

    test.each([
        [{ body: { email: `test@example.com` } }, v4uuid()],
        [{ body: { email: user.email } }, userResetUuid],
    ])(`(${name}) - UserPasswordResetService.create valid partitions`, async (options, resetUuid) => {
        await UserPasswordResetService.create(options, resetUuid);
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



    /**
     * UserPasswordResetService.resetPassword
     */

    test.each([
        [{ uuid: userResetUuid, body: { password: userRandomPass } }, user.email],
    ])(`(${name}) - UserPasswordResetService.resetPassword valid partitions`, async (options, email) => {
        await UserPasswordResetService.resetPassword(options);
        // Verify the password is working
        const { token } = await UserService.login({ body: { email, password: options.body.password } });
        expect(token).toBeDefined();
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

userPasswordResetServiceTest(RelationalUserPasswordResetService, RelationalUserService, 'Relational');
userPasswordResetServiceTest(DocumentUserPasswordResetService, DocumentUserService, 'Document');
userPasswordResetServiceTest(GraphUserPasswordResetService, GraphUserService, 'Graph');
