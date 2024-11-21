import RelationalGoogleAuthService from '../../src/relational-based/services/google_auth_service.js';
import RelationalUserService from '../../src/relational-based/services/user_service.js';

import DocumentGoogleAuthService from '../../src/document-based/services/google_auth_service.js';
import DocumentUserService from '../../src/document-based/services/user_service.js';

import GraphGoogleAuthService from '../../src/graph-based/services/google_auth_service.js';
import GraphUserService from '../../src/graph-based/services/user_service.js';

import { context } from '../context.js';
import { test, expect, beforeAll } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

const googleAuthTest = (GoogleAuthService, UserService, name) => {
    const id1 = uuidv4();
    const id2 = uuidv4();
    const user = { 
        uuid: uuidv4(),
        username: `test-${uuidv4()}`,
        email: `test-${uuidv4()}@example.com`,
        password: '12345678',
    };

    beforeAll(async () => {
        await UserService.create({ body: user });
    });

    test(`(${name}) - GoogleAuthService must implement expected methods`, () => {
        expect(GoogleAuthService).toHaveProperty('create');
        expect(GoogleAuthService).toHaveProperty('login');
        expect(GoogleAuthService).toHaveProperty('addToExistingUser');
    });

    test.each([
        [{ info: { data: { id: id1, email: `test-${uuidv4()}@example.com`, picture: `test-${uuidv4()}` } } }],
        [{ info: { data: { id: id2, email: `test-${uuidv4()}@example.com` } } }],
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
    ])(`(${name}) - GoogleAuthService.create invalid partitions`, async (options, expected) => {
        expect(async () => await GoogleAuthService.create(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ info: { data: { id: id1 } } }],
        [{ info: { data: { id: id2 } } }],
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
    ])(`(${name}) - GoogleAuthService.login invalid partitions`, async (options, expected) => {
        expect(async () => await GoogleAuthService.login(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ third_party_id: uuidv4(), type: 'Google', user: { sub: user.uuid } }],
    ])(`(${name}) - GoogleAuthService.addToExistingUser valid partitions`, async (options) => {
        await GoogleAuthService.addToExistingUser(options);
        const userLogins = await UserService.getUserLogins({ uuid: options.user.sub });
        expect(userLogins.length).toBeGreaterThan(0);
        const googleLogin = userLogins.find(login => login.user_login_type_name === "Google");

        expect(googleLogin).toHaveProperty('uuid');
        expect(googleLogin).toHaveProperty('user_login_type_name');
        expect(googleLogin).toHaveProperty('created_at');
        expect(googleLogin).toHaveProperty('updated_at');
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
        [{ third_party_id: "test", type: "Other", user: { sub: "test" } }, 'Only Google are currently supported'],
    ])(`(${name}) - GoogleAuthService.addToExistingUser invalid partitions`, async (options, expected) => {
        expect(async () => await GoogleAuthService.addToExistingUser(options)).rejects.toThrowError(expected);
    });
};

googleAuthTest(
    RelationalGoogleAuthService,
    RelationalUserService, 
    'Relational'
);

googleAuthTest(
    DocumentGoogleAuthService,
    DocumentUserService, 
    'Document'
);

googleAuthTest(
    GraphGoogleAuthService,
    GraphUserService, 
    'Graph'
);
