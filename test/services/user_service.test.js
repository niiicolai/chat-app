import RelationalUserService from '../../src/relational-based/services/user_service.js';
import DocumentUserService from '../../src/document-based/services/user_service.js';
import GraphUserService from '../../src/graph-based/services/user_service.js';

import data from '../../src/seed_data.js';
import { test, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

const userServiceTest = (UserService, name) => {

    /**
     * Exisiting entities
     */

    const admin = { sub: data.users[0].uuid, email: data.users[0].email, password: '12345678', username: data.users[0].username };
    const mod = { sub: data.users[1].uuid, email: data.users[1].email, password: '12345678', username: data.users[1].username };
    const member = { sub: data.users[2].uuid, email: data.users[2].email, password: '12345678', username: data.users[2].username };



    /**
     * Fake entities
     */
    const fakeId = '1635e897-b84b-4b98-b8cf-5471ff349022';
    


    /**
     * New use and login
     */

    const login_uuid = uuidv4();
    const user = {
        uuid: uuidv4(),
        username: `test-user`,
        email: `test-user@example.com`,
        password: '12345678',
    };



    /**
     * Expected methods
     */

    test(`(${name}) - UserService must implement expected methods`, () => {
        expect(UserService).toHaveProperty('create');
        expect(UserService).toHaveProperty('login');
        expect(UserService).toHaveProperty('update');
        expect(UserService).toHaveProperty('destroy');
        expect(UserService).toHaveProperty('destroyAvatar');
        expect(UserService).toHaveProperty('getUserLogins');
        expect(UserService).toHaveProperty('createUserLogin');
        expect(UserService).toHaveProperty('destroyUserLogins');
        expect(UserService).toHaveProperty('getUserEmailVerification');
    });

    

    /**
     * UserService.findOne
     */

    test.each([
        [{ uuid: admin.sub }],
        [{ uuid: mod.sub }],
        [{ uuid: member.sub }],
    ])(`(${name}) - UserService.findOne valid partitions`, async (options) => {
        const user = await UserService.findOne(options);

        expect(user).not.toHaveProperty('password');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('email');
    });

    test.each([
        [undefined, 'No uuid provided'],
        [null, 'No options provided'],
        [{}, 'No uuid provided'],
        [[], 'No uuid provided'],
        [{ email: null }, 'No uuid provided'],
        [{ test: null }, 'No uuid provided'],
    ])(`(${name}) - UserService.findOne invalid partitions`, async (options, expected) => {
        expect(async () => await UserService.findOne(options)).rejects.toThrowError(expected);
    });



    /**
     * UserService.create
     */

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
        [{ body: { email: 'test@test.test', uuid: fakeId } }, 'No username provided'],
        [{ body: { email: 'test@test.test', uuid: fakeId, username: 'test' } }, 'No password provided'],
        [{ body: { uuid: fakeId, username: 'test', password: 'test' } }, 'No email provided'],
        [{ body: { uuid: user.uuid, email: 'test@teadssadst.test', username: 'testsdaasd', password: 'test' } }, `user with PRIMARY ${user.uuid} already exists`],
        [{ body: { uuid: fakeId, email: user.email, username: 'testaaasd', password: 'test' } }, `user with user_email ${user.email} already exists`],
        [{ body: { uuid: fakeId, email: 'testads@test.test', username: user.username, password: 'test' } }, `user with user_username ${user.username} already exists`],
    ])(`(${name}) - UserService.create invalid partitions`, async (options, expected) => {
        expect(async () => await UserService.create(options)).rejects.toThrowError(expected);
    });



    /**
     * UserService.login
     */

    test.each([
        [{ body: admin }],
        [{ body: mod }],
        [{ body: member }],
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



    /**
     * UserService.update
     */

    test(`(${name}) - UserService.update valid partitions`, async () => {
        const username = `test-${uuidv4()}`;
        const email = `test-${uuidv4()}@example.com`;
        const password = 'testtest';
        const result = await UserService.update({ uuid: user.uuid, body: { 
            username,
            email,
            password,
        } });

        expect(result).toHaveProperty('username');
        expect(result).toHaveProperty('email');
        expect(result).not.toHaveProperty('password');
        expect(result.username).toBe(username);
        expect(result.email).toBe(email);

        // verify password change
        const login = await UserService.login({ body: { email, password } });
        expect(login).toHaveProperty('token');
    });

    test.each([
        [undefined, 'No body provided'],
        [null, 'No options provided'],
        ["", 'No options provided'],
        [0, 'No options provided'],
        [{}, 'No body provided'],
        [{ body: null }, 'No body provided'],
        [{ body: {} }, 'No UUID provided'],
        [{ body: {}, uuid: null }, 'No UUID provided'],
        [{ body: {}, uuid: fakeId }, 'user not found'],
        [{ body: { username: admin.username }, uuid: user.uuid }, `user with user_username ${admin.username} already exists`],
        [{ body: { email: admin.email }, uuid: user.uuid }, `user with user_email ${admin.email} already exists`],
    ])(`(${name}) - UserService.update invalid partitions`, async (options, expected) => {
        expect(async () => await UserService.update(options)).rejects.toThrowError(expected);
    });



    /**
     * UserService.createUserLogin
     */

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
        [{ uuid: fakeId }, 'No body provided'],
        [{ uuid: fakeId, body: null }, 'No body provided'],
        [{ uuid: user.uuid, body: {} }, 'No uuid provided'],
        [{ uuid: user.uuid, body: { uuid: 'test', user_login_type_name: "Password" } }, 'No password provided'],
        [{ uuid: user.uuid, body: { uuid: 'test', user_login_type_name: "Google" } }, 'No third_party_id provided'],
    ])(`(${name}) - UserService.createUserLogin invalid partitions`, async (options, expected) => {
        expect(async () => await UserService.createUserLogin(options)).rejects.toThrowError(expected);
    });



    /**
     * UserService.getUserLogins
     */

    test.each([
        [{ uuid: admin.sub }, 1],
        [{ uuid: mod.sub }, 1],
        [{ uuid: member.sub }, 1],
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
        [{ uuid: fakeId }, 'user not found'],
    ])(`(${name}) - UserService.getUserLogins invalid partitions`, async (options, expected) => {
        expect(async () => await UserService.getUserLogins(options)).rejects.toThrowError(expected);
    });



    /**
     * UserService.destroyUserLogins
     */

    test(`(${name}) - UserService.destroyUserLogins valid partitions`, async () => {
        await UserService.destroyUserLogins({ uuid: user.uuid, login_uuid });

        const result = await UserService.getUserLogins({ uuid: user.uuid });
        expect(result.length).toBe(1);
    });

    test.each([
        [undefined, 'No UUID provided'],
        [null, 'No options provided'],
        ["", 'No options provided'],
        [0, 'No options provided'],
        [{}, 'No UUID provided'],
        [{ uuid: null }, 'No UUID provided'],
        [{ uuid: fakeId }, 'No login UUID provided'],
        [{ uuid: user.uuid, login_uuid: null }, 'No login UUID provided'],
        [{ uuid: user.uuid, login_uuid: fakeId }, 'user_login not found'],
    ])(`(${name}) - UserService.destroyUserLogins invalid partitions`, async (options, expected) => {
        expect(async () => await UserService.destroyUserLogins(options)).rejects.toThrowError(expected);
    });



    /**
     * UserService.destroy
     */

    test(`(${name}) - UserService.destroy valid partitions`, async () => {
        await UserService.destroy({ uuid: user.uuid });
        expect(async () => await UserService.destroy({ uuid: user.uuid }))
            .rejects.toThrowError(`user not found`);
    });

    test.each([
        [undefined, 'No UUID provided'],
        [null, 'No options provided'],
        ["", 'No options provided'],
        [0, 'No options provided'],
        [{}, 'No UUID provided'],
        [{ uuid: null }, 'No UUID provided'],
        [{ uuid: fakeId }, 'user not found'],
    ])(`(${name}) - UserService.destroy invalid partitions`, async (options, expected) => {
        expect(async () => await UserService.destroy(options)).rejects.toThrowError(expected);
    });
};

userServiceTest(RelationalUserService, 'Relational');
userServiceTest(DocumentUserService, 'Document');
userServiceTest(GraphUserService, 'Graph');

