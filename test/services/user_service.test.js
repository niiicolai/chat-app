import RelationalUserService from '../../src/relational-based/services/user_service.js';
import DocumentUserService from '../../src/document-based/services/user_service.js';
import GraphUserService from '../../src/graph-based/services/user_service.js';
import { test, expect } from 'vitest';
import { context } from '../context.js';
import { v4 as uuidv4 } from 'uuid';

const userServiceTest = (UserService, name) => {
    const login_uuid = uuidv4();
    const user = {
        uuid: uuidv4(),
        username: `test-${uuidv4()}`,
        email: `test-${uuidv4()}@example.com`,
        password: '12345678',
    };

    test(`(${name}) - UserService must implement expected methods`, () => {
        expect(UserService).toHaveProperty('create');
        expect(UserService).toHaveProperty('login');
        expect(UserService).toHaveProperty('update');
        expect(UserService).toHaveProperty('destroy');
        expect(UserService).toHaveProperty('destroyAvatar');
        expect(UserService).toHaveProperty('getUserLogins');
        expect(UserService).toHaveProperty('createUserLogin');
        expect(UserService).toHaveProperty('destroyUserLogins');
    });

    test(`(${name}) - UserService.create valid partitions`, async () => {
        const result = await UserService.create({ body: { ...user } });

        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('user');
        expect(result.user).not.toHaveProperty('password');
        expect(result.user.username).toBe(user.username);
        expect(result.user.email).toBe(user.email);
    });

    test.each([
        [undefined, 'No body provided'],
        [null, 'No options provided'],
        ["", 'No options provided'],
        [0, 'No options provided'],
        [{}, 'No body provided'],
        [{ body: undefined }, 'No body provided'],
        [{ body: null }, 'No body provided'],
        [{ body: { email: 'test@test.test' } }, 'No UUID provided'],
        [{ body: { email: 'test@test.test', uuid: 'test' } }, 'No username provided'],
        [{ body: { email: 'test@test.test', uuid: 'test', username: 'test' } }, 'No password provided'],
        [{ body: { uuid: 'test', username: 'test', password: 'test' } }, 'No email provided'],
        [{ body: { uuid: user.uuid, email: 'test@test.test', username: 'test', password: 'test' } }, 'UUID already exists'],
        [{ body: { uuid: 'test', email: user.email, username: 'test', password: 'test' } }, 'Email already exists'],
        [{ body: { uuid: 'test', email: 'test@test.test', username: user.username, password: 'test' } }, 'Username already exists'],
    ])(`(${name}) - UserService.create invalid partitions`, async (options, expected) => {
        expect(async () => await UserService.create(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ body: context.admin }],
        [{ body: context.mod }],
        [{ body: context.member }],
        [{ body: user }],
    ])(`(${name}) - UserService.login valid partitions`, async (options) => {
        const result = await UserService.login(options);

        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('user');
        expect(result.user).not.toHaveProperty('password');
        expect(result.user.username).toBe(options.body.username);
        expect(result.user.email).toBe(options.body.email);
    });

    test.each([
        [undefined, 'No body provided'],
        [null, 'No options provided'],
        ["", 'No options provided'],
        [0, 'No options provided'],
        [{}, 'No body provided'],
        [{ body: undefined }, 'No body provided'],
        [{ body: null }, 'No body provided'],
        [{ body: { email: 'test@test.test' } }, 'No password provided'],
        [{ body: { password: 'test' } }, 'No email provided'],
        [{ body: { email: 'not_a_valid_mail@test.test', password: '1234' } }, 'Invalid email or password'],
    ])(`(${name}) - UserService.login invalid partitions`, async (options, expected) => {
        expect(async () => await UserService.login(options)).rejects.toThrowError(expected);
    });

    test(`(${name}) - UserService.update valid partitions`, async () => {
        const username = `test-${uuidv4()}`;
        const result = await UserService.update({ uuid: user.uuid, body: { username }, user: { sub: user.uuid } });

        expect(result).toHaveProperty('username');
        expect(result).toHaveProperty('email');
        expect(result).not.toHaveProperty('password');
        expect(result.username).toBe(username);
        expect(result.email).toBe(user.email);
    });

    test.each([
        [undefined, 'No body provided'],
        [null, 'No options provided'],
        ["", 'No options provided'],
        [0, 'No options provided'],
        [{}, 'No body provided'],
        [{ body: null }, 'No body provided'],
        [{ body: {} }, 'No user provided'],
        [{ body: {}, user: null }, 'No user provided'],
        [{ body: {}, user: {} }, 'No user UUID provided'],
        [{ body: {}, user: { sub: null } }, 'No user UUID provided'],
        [{ body: {}, user: { sub: 'test' } }, 'User not found'],
    ])(`(${name}) - UserService.update invalid partitions`, async (options, expected) => {
        expect(async () => await UserService.update(options)).rejects.toThrowError(expected);
    });

    test(`(${name}) - UserService.createUserLogin valid partitions`, async () => {
        const result = await UserService.createUserLogin({
            uuid: user.uuid, body: {
                uuid: login_uuid,
                user_login_type_name: 'Google',
                third_party_id: 'test',
            }
        });

        expect(result).toHaveProperty('uuid');
        expect(result).toHaveProperty('user_login_type_name');
        expect(result).not.toHaveProperty('password');
        expect(result.uuid).toBe(login_uuid);
        expect(result.user_login_type_name).toBe('Google');
    });

    test.each([
        [undefined, 'No UUID provided'],
        [null, 'No options provided'],
        ["", 'No options provided'],
        [0, 'No options provided'],
        [{}, 'No UUID provided'],
        [{ uuid: null }, 'No UUID provided'],
        [{ uuid: "test" }, 'No body provided'],
        [{ uuid: "test", body: null }, 'No body provided'],
        [{ uuid: user.uuid, body: {} }, 'No uuid provided'],
        [{ uuid: user.uuid, body: { uuid: 'test', user_login_type_name: "Password" } }, 'No password provided'],
        [{ uuid: user.uuid, body: { uuid: 'test', user_login_type_name: "Google" } }, 'No third_party_id provided'],
    ])(`(${name}) - UserService.createUserLogin invalid partitions`, async (options, expected) => {
        expect(async () => await UserService.createUserLogin(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ uuid: context.admin.sub }, 1],
        [{ uuid: context.mod.sub }, 1],
        [{ uuid: context.member.sub }, 1],
        [{ uuid: user.uuid }, 2],
    ])(`(${name}) - UserService.getUserLogins valid partitions`, async (options, length) => {
        const result = await UserService.getUserLogins(options);

        expect(result.length).toBe(length);
        expect(result[0]).toHaveProperty('uuid');
        expect(result[0]).toHaveProperty('user_login_type_name');
        expect(result[0]).not.toHaveProperty('password');
        expect(result[0].user_login_type_name).toMatch(/Password|Google/);
    });

    test.each([
        [undefined, 'No UUID provided'],
        [null, 'No options provided'],
        ["", 'No options provided'],
        [0, 'No options provided'],
        [{}, 'No UUID provided'],
        [{ uuid: null }, 'No UUID provided'],
        [{ uuid: "test" }, 'User not found'],
    ])(`(${name}) - UserService.getUserLogins invalid partitions`, async (options, expected) => {
        expect(async () => await UserService.getUserLogins(options)).rejects.toThrowError(expected);
    });

    test(`(${name}) - UserService.createUserLogin valid partitions`, async () => {
        await UserService.destroyUserLogins({ uuid: user.uuid, login_uuid });

        const result = await UserService.getUserLogins({ uuid: user.uuid });
        expect(result.length).toBe(1);
    });
};

userServiceTest(RelationalUserService, 'Relational');
userServiceTest(DocumentUserService, 'Document');
userServiceTest(GraphUserService, 'Graph');
