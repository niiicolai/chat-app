import RelationalGoogleAuthService from '../../src/relational-based/services/google_auth_service.js';
import RelationalUserService from '../../src/relational-based/services/user_service.js';

import DocumentGoogleAuthService from '../../src/document-based/services/google_auth_service.js';
import DocumentUserService from '../../src/document-based/services/user_service.js';

import GraphGoogleAuthService from '../../src/graph-based/services/google_auth_service.js';
import GraphUserService from '../../src/graph-based/services/user_service.js';

import data from '../../src/seed_data.js';
import { test, expect, afterAll } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

const googleAuthTest = (GoogleAuthService, UserService, name) => {

    /**
     * New users
     */

    const new_user1_uuid = uuidv4();
    const new_user2_uuid = uuidv4();
    const new_user1_third_party_id = uuidv4();
    const new_user2_third_party_id = uuidv4();



    /**
     * Existing user
     */

    const user = { sub: data.users[0].uuid, email: data.users[0].email };
    const user_new_login_uuid = uuidv4();
    const user_new_login_third_party_id = uuidv4();



    /**
     * Fake entities
     */

    const fakeId = '1635e897-b84b-4b98-b8cf-5471ff349022';



    /**
     * Clean up
     */

    afterAll(async () => {
        await UserService.destroyUserLogins({ uuid: user.sub, login_uuid: user_new_login_uuid });
        await UserService.destroy({ uuid: new_user1_uuid });
        await UserService.destroy({ uuid: new_user2_uuid });
    });



    /**
     * Expected methods
     */

    test(`(${name}) - GoogleAuthService must implement expected methods`, () => {
        expect(GoogleAuthService).toHaveProperty('create');
        expect(GoogleAuthService).toHaveProperty('login');
        expect(GoogleAuthService).toHaveProperty('addToExistingUser');
    });



    /**
     * GoogleAuthService.addToExistingUser
     */

    test.each([
        [{ third_party_id: user_new_login_third_party_id, login_uuid: user_new_login_uuid, type: 'Google', user }],
    ])(`(${name}) - GoogleAuthService.addToExistingUser valid partitions`, async (options) => {
        await GoogleAuthService.addToExistingUser(options);
        const userLogins = await UserService.getUserLogins({ uuid: options.user.sub });
        expect(userLogins.length).toBeGreaterThan(0);
        const googleLogin = userLogins.find(login => login.user_login_type_name === "Google");

        expect(googleLogin).toHaveProperty('uuid');
        expect(googleLogin).toHaveProperty('user_login_type_name');
        expect(googleLogin).not.toHaveProperty('third_party_id');
        expect(googleLogin).not.toHaveProperty('password');
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No third_party_id provided'],
        [0, 'No options provided'],
        [[], 'No third_party_id provided'],
        [{}, 'No third_party_id provided'],
        [{ third_party_id: "test" }, 'No type provided'],
        [{ third_party_id: "test", type: "Google" }, 'No user provided'],
        [{ third_party_id: "test", type: "Google", user: {} }, 'No user.sub provided'],
        [{ third_party_id: "test", type: "Other", user: { sub: fakeId } }, 'Only Google are currently supported'],
        [{ third_party_id: "test", type: "Google", user: { sub: fakeId } }, 'user not found'],
        [{ third_party_id: user_new_login_third_party_id, type: "Google", user }, 'User already has a Google account linked'],
    ])(`(${name}) - GoogleAuthService.addToExistingUser invalid partitions`, async (options, expected) => {
        expect(async () => await GoogleAuthService.addToExistingUser(options)).rejects.toThrowError(expected);
    });



    /**
     * GoogleAuthService.create
     */

    test.each([
        [{ info: { data: { id: new_user1_third_party_id, email: `test-${uuidv4()}@example.com`, picture: `test-${uuidv4()}` } }, user_uuid: new_user1_uuid }],
        [{ info: { data: { id: new_user2_third_party_id, email: `test-${uuidv4()}@example.com` } }, user_uuid: new_user2_uuid }],
    ])(`(${name}) - GoogleAuthService.create valid partitions`, async (options) => {
        const result = await GoogleAuthService.create(options);

        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('user');
        expect(result.user).toHaveProperty('username');
        expect(result.user).toHaveProperty('email');
        expect(result.user).not.toHaveProperty('password');
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'The response from Google is empty'],
        [0, 'No options provided'],
        [[], 'The response from Google is empty'],
        [{}, 'The response from Google is empty'],
        [{ info: { } }, 'No data in the response from Google'],
        [{ info: { data: { } } }, 'No id in the response from Google'],
        [{ info: { data: { id: "test" } } }, 'No email in the response from Google'],
        [{ info: { data: { id: "test", email: user.email } } }, `user with email ${user.email} already exists`],
        [{ info: { data: { id: user_new_login_third_party_id, email: "test4@test.test" } } }, `user with third_party_id ${user_new_login_third_party_id} already exists`],
    ])(`(${name}) - GoogleAuthService.create invalid partitions`, async (options, expected) => {
        expect(async () => await GoogleAuthService.create(options)).rejects.toThrowError(expected);
    });



    /**
     * GoogleAuthService.login
     */

    test.each([
        [{ info: { data: { id: new_user1_third_party_id } } }],
        [{ info: { data: { id: new_user2_third_party_id } } }],
    ])(`(${name}) - GoogleAuthService.login valid partitions`, async (options) => {
        const result = await GoogleAuthService.login(options);

        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('user');
        expect(result.user).toHaveProperty('username');
        expect(result.user).toHaveProperty('email');
        expect(result.user).not.toHaveProperty('password');
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'The response from Google is empty'],
        [0, 'No options provided'],
        [[], 'The response from Google is empty'],
        [{}, 'The response from Google is empty'],
        [{ info: { } }, 'No data in the response from Google'],
        [{ info: { data: { } } }, 'No id in the response from Google'],
        [{ info: { data: { id: "test" } } }, 'user_login not found'],
    ])(`(${name}) - GoogleAuthService.login invalid partitions`, async (options, expected) => {
        expect(async () => await GoogleAuthService.login(options)).rejects.toThrowError(expected);
    });
};

googleAuthTest(RelationalGoogleAuthService, RelationalUserService, 'Relational');
googleAuthTest(DocumentGoogleAuthService, DocumentUserService, 'Document');
//googleAuthTest(GraphGoogleAuthService, GraphUserService, 'Graph');
